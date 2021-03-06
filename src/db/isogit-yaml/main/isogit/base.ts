import * as path from 'path';
// import * as https from 'https';

import { spawn, Worker, Thread } from 'threads';

import AsyncLock from 'async-lock';
import git, { Errors } from 'isomorphic-git';
import * as log from 'electron-log';

import { GitStatus } from '../../base';
import { GitAuthentication } from './types';

import { GitWorkerSpec, GitMethods } from './worker';


const MAIN_REMOTE = 'origin';


const INITIAL_STATUS: GitStatus = {
  isOnline: false,
  isMisconfigured: false,
  hasLocalChanges: false,
  needsPassword: false,
  statusRelativeToLocal: undefined,
  lastSynchronized: null,
  isPushing: false,
  isPulling: false,
} as const;


export class IsoGitWrapper {

  private auth: GitAuthentication = {};

  private pushPending = false;

  private stagingLock: AsyncLock;

  private status: GitStatus;

  private worker: (Thread & GitMethods) | null = null;

  private async getWorker(): Promise<GitMethods> {

    if (!this.worker) {
      const worker = await spawn<GitWorkerSpec>(new Worker('./worker'));
      this.worker = worker;
      Thread.events(worker).subscribe(evt => {
        log.info("C/db/isogit: Worker event:", evt)
        // TODO: Respawn on exit
      });
    }

    return this.worker;
  }

  constructor(
      private fs: any,
      private repoUrl: string,
      private upstreamRepoUrl: string | undefined,
      username: string,
      private author: { name: string, email: string },
      public workDir: string,
      private corsProxy: string | undefined,
      private statusReporter: (payload: GitStatus) => Promise<void>) {

    this.stagingLock = new AsyncLock({ timeout: 20000, maxPending: 2 });

    if (this.corsProxy) {
      log.warn("C/db/isogit: CORS proxy parameter is obsolete and will be removed.");
    }
    if (this.upstreamRepoUrl !== undefined) {
      log.warn("C/db/isogit: the upstreamRepoUrl parameter is obsolete and will be removed.");
    }

    // Makes it easier to bind these to IPC events
    this.synchronize = this.synchronize.bind(this);
    this.resetFiles = this.resetFiles.bind(this);
    this.checkUncommitted = this.checkUncommitted.bind(this);

    this.auth.username = username;

    this.status = INITIAL_STATUS;
  }


  // Reporting Git status to DB backend,
  // so that it can be reflected in the GUI

  private async reportStatus() {
    return await this.statusReporter(this.status);
  }

  private async setStatus(status: Partial<GitStatus>) {
    Object.assign(this.status, status);
    await this.reportStatus();
  }

  public getStatus(): GitStatus {
    return this.status;
  }


  // Initilaization

  public async isInitialized(): Promise<boolean> {
    let hasGitDirectory: boolean;
    try {
      hasGitDirectory = (await this.fs.stat(path.join(this.workDir, '.git'))).isDirectory();
    } catch (e) {
      hasGitDirectory = false;
    }
    return hasGitDirectory;
  }

  public async isUsingRemoteURLs(remoteUrls: { origin: string }): Promise<boolean> {
    const origin = (await this.getOriginUrl() || '').trim();
    return origin === remoteUrls.origin;
  }

  public needsPassword(): boolean {
    return (this.auth.password || '').trim() === '';
  }

  public getUsername(): string | undefined {
    return this.auth.username;
  }

  public async terminate() {
    if (this.worker) {
      await Thread.terminate(this.worker);
    }
  }

  public async destroy() {
    /* Removes working directory.
       On next sync Git repo will have to be reinitialized, cloned etc. */

    log.warn("C/db/isogit: Initialize: Removing data directory");
    await this.fs.remove(this.workDir);
  }

  private async forceInitialize() {
    /* Initializes from scratch: wipes work directory, clones repository, adds remotes. */

    return await this.stagingLock.acquire('1', async () => {
      log.warn("C/db/isogit: Initializing");

      log.silly("C/db/isogit: Initialize: Ensuring data directory exists");
      await this.fs.ensureDir(this.workDir);

      log.verbose("C/db/isogit: Initialize: Cloning", this.repoUrl);

      const worker = await this.getWorker();
      try {
        await worker.clone({
          action: 'clone',
          workDir: this.workDir,
          repoURL: this.repoUrl,
          auth: this.auth,
        });
      } catch (e) {
        log.error("C/db/isogit: Error during initialization: Cannot clone", JSON.stringify(e))
        await this.fs.remove(this.workDir);
        await this._handleGitError(e);
      }
    });
  }


  // Authentication

  public async setPassword(value: string | undefined) {
    this.auth.password = value;
    this.setStatus({ needsPassword: (value || '').trim() === '' });
  }


  // Git operations

  async configSet(prop: string, val: string) {
    log.verbose("C/db/isogit: Set config");
    await git.setConfig({ fs: this.fs, dir: this.workDir, path: prop, value: val });
  }

  async configGet(prop: string): Promise<string> {
    log.verbose("C/db/isogit: Get config", prop);
    return await git.getConfig({ fs: this.fs, dir: this.workDir, path: prop });
  }

  async readFileBlobAtCommit(relativeFilePath: string, commitHash: string): Promise<string> {
    /* Reads file contents at given path as of given commit. File contents must use UTF-8 encoding. */

    return (await git.readBlob({
      fs: this.fs,
      dir: this.workDir,
      oid: commitHash,
      filepath: relativeFilePath,
    })).blob.toString();
  }

  async pull() {
    log.verbose("C/db/isogit: Pulling master with fast-forward merge");

    const worker = await this.getWorker();
    try {
      await worker.pull({
        action: 'pull',
        workDir: this.workDir,
        repoURL: this.repoUrl,
        auth: this.auth,
        author: this.author,
      });
    } catch (e) {
      log.error("C/db/isogit: Failed to pull", e);
      throw e;
    }
  }

  async stage(pathSpecs: string[], removing = false) {
    log.verbose(`C/db/isogit: Staging changes: ${pathSpecs.join(', ')} using ${removing ? "remove()" : "add()"}`);

    for (const pathSpec of pathSpecs) {
      if (removing !== true) {
        await git.add({
          fs: this.fs,
          dir: this.workDir,
          filepath: pathSpec,
        });
      } else {
        await git.remove({
          fs: this.fs,
          dir: this.workDir,
          filepath: pathSpec,
        });
      }
    }
  }

  async commit(msg: string) {
    log.verbose(`C/db/isogit: Committing with message ${msg}`);

    return await git.commit({
      fs: this.fs,
      dir: this.workDir,
      message: msg,
      author: this.author,
    });
  }

  async push() {
    log.verbose("C/db/isogit: Pushing");

    const worker = await this.getWorker();
    try {
      await worker.push({
        action: 'push',
        workDir: this.workDir,
        repoURL: this.repoUrl,
        auth: this.auth,
      });
    } catch (e) {
      log.error("C/db/isogit: Failed to push", e);
      throw e;
    }
  }

  public async resetFiles(paths?: string[]) {
    return await this.stagingLock.acquire('1', async () => {
      log.verbose("C/db/isogit: Force resetting files");

      return await git.checkout({
        fs: this.fs,
        dir: this.workDir,
        force: true,
        filepaths: paths || (await this.listChangedFiles()),
      });
    });
  }

  async getOriginUrl(): Promise<string | null> {
    return ((await git.listRemotes({
      fs: this.fs,
      dir: this.workDir,
    })).find(r => r.remote === MAIN_REMOTE) || { url: null }).url;
  }

  async listLocalCommits(): Promise<string[]> {
    /* Returns a list of commit messages for commits that were not pushed yet.

       Useful to check which commits will be thrown out
       if we force update to remote master.

       Does so by walking through last 100 commits starting from current HEAD.
       When it encounters the first local commit that doesn’t descends from remote master HEAD,
       it considers all preceding commits to be ahead/local and returns them.

       If it finishes the walk without finding an ancestor, throws an error.
       It is assumed that the app does not allow to accumulate
       more than 100 commits without pushing (even 100 is too many!),
       so there’s probably something strange going on.

       Other assumptions:

       * git.log returns commits from newest to oldest.
       * The remote was already fetched.

    */

    return await this.stagingLock.acquire('1', async () => {
      const latestRemoteCommit = await git.resolveRef({
        fs: this.fs,
        dir: this.workDir,
        ref: `${MAIN_REMOTE}/master`,
      });

      const localCommits = await git.log({
        fs: this.fs,
        dir: this.workDir,
        depth: 100,
      });

      var commits = [] as string[];
      for (const commit of localCommits) {
        if (await git.isDescendent({
            fs: this.fs,
            dir: this.workDir,
            oid: commit.oid,
            ancestor: latestRemoteCommit,
          })) {
          commits.push(commit.commit.message);
        } else {
          return commits;
        }
      }

      throw new Error("Did not find a local commit that is an ancestor of remote master");
    });
  }

  public async listChangedFiles(pathSpecs = ['.']): Promise<string[]> {
    /* Lists relative paths to all files that were changed and have not been committed. */

    const FILE = 0, HEAD = 1, WORKDIR = 2;

    return (await git.statusMatrix({ fs: this.fs, dir: this.workDir, filepaths: pathSpecs }))
      .filter(row => row[HEAD] !== row[WORKDIR])
      .map(row => row[FILE])
      .filter(filepath => !filepath.startsWith('..') && filepath !== ".DS_Store");
  }

  public async stageAndCommit(pathSpecs: string[], msg: string, removing = false): Promise<number> {
    /* Stages and commits files matching given path spec with given message.

       Any other files staged at the time of the call will be unstaged.

       Returns the number of matching files with unstaged changes prior to staging.
       If no matching files were found having unstaged changes,
       skips the rest and returns zero.

       If failIfDiverged is given, attempts a fast-forward pull after the commit.
       It will fail immediately if main remote had other commits appear in meantime.

       Locks so that this method cannot be run concurrently (by same instance).
    */

    if (pathSpecs.length < 1) {
      throw new Error("Wasn’t given any paths to commit!");
    }

    return await this.stagingLock.acquire('1', async () => {
      log.verbose(`C/db/isogit: Staging and committing: ${pathSpecs.join(', ')}`);

      const filesChanged = (await this.listChangedFiles(pathSpecs)).length;
      if (filesChanged < 1) {
        return 0;
      }

      await this.unstageAll();
      await this.stage(pathSpecs, removing);
      await this.commit(msg);

      return filesChanged;
    });
  }

  public async checkUncommitted(): Promise<boolean> {
    /* Checks for any uncommitted changes locally present.
       Notifies all windows about the status. */

    log.debug("C/db/isogit: Checking for uncommitted changes");
    const changedFiles = await this.listChangedFiles();
    log.debug("C/db/isogit: Changed files:", changedFiles);
    const hasLocalChanges = changedFiles.length > 0;
    await this.setStatus({ hasLocalChanges });
    return hasLocalChanges;
  }

  public requestPush() {
    this.pushPending = true;
  }

  public async synchronize(): Promise<{ completed: boolean, possiblyMutatedData: boolean }> {
    /* Checks for connection, local changes and unpushed commits,
       tries to push and pull when there’s opportunity.

       Notifies all windows about the status in process. */

    log.verbose("C/db/isogit: Checking if clone exists");

    if (!(await this.isInitialized())) {
      await this.forceInitialize();

    } else {
      log.verbose("C/db/isogit: Checking for uncommitted changes");

      await this.setStatus({
        ...INITIAL_STATUS,

        hasLocalChanges: false,
        lastSynchronized: this.status.lastSynchronized,

        isOnline: true,
        isPulling: true,
      });

      const hasUncommittedChanges = await this.checkUncommitted();

      if (hasUncommittedChanges) {
        // Do not run pull if there are unstaged/uncommitted changes
        await this.setStatus({ isPulling: false, hasLocalChanges: true });
        return { completed: false, possiblyMutatedData: false };

      } else {
        // If uncommitted changes weren’t detected, there may still be changed files
        // that are not managed by the backend (e.g., .DS_Store). Discard any stuff like that.
        await this.resetFiles(['.']);
      }
    }

    if (this.stagingLock.isBusy()) {
      log.verbose("C/db/isogit: Lock is busy, skipping sync");
      await this.setStatus({ isPulling: false });
      return { completed: false, possiblyMutatedData: false };
    }

    log.verbose("C/db/isogit: Queueing sync now, lock is not busy");

    return await this.stagingLock.acquire('1', async () => {
      log.verbose("C/db/isogit: Starting sync");

      const needsPassword = this.needsPassword();

      if (needsPassword) {
        await this.setStatus({ needsPassword });
        return { completed: false, possiblyMutatedData: false };
      }

      await this.setStatus({
        needsPassword: false,
        isOnline: true,
        isPulling: true,
      });

      try {
        await this.pull();

      } catch (e) {
        log.error(e);
        await this.setStatus({
          isPulling: false,
          isPushing: false,
          lastSynchronized: new Date(),
          isOnline: false,
        });
        await this._handleGitError(e);
        return { completed: false, possiblyMutatedData: false };
      }
      //await this.setStatus({ isPulling: false });

      if (this.pushPending) {
        // Run push AFTER pull. May result in false-positive non-fast-forward rejection
        await this.setStatus({ isPushing: true });

        try {
          await this.push();

        } catch (e) {
          log.error(e);
          await this.setStatus({
            isPulling: false,
            isPushing: false,
            lastSynchronized: new Date(),
          });
          await this._handleGitError(e);
          return { completed: false, possiblyMutatedData: true };
        }
        this.pushPending = false;
        //await this.setStatus({ isPushing: false });
      }

      await this.setStatus({
        statusRelativeToLocal: 'updated',
        isOnline: true,
        isMisconfigured: false,
        lastSynchronized: new Date(),
        needsPassword: false,
        isPushing: false,
        isPulling: false,
      });

      return { completed: true, possiblyMutatedData: true };
    });
  }

  private async unstageAll() {
    log.verbose("C/db/isogit: Unstaging all changes");
    await git.remove({ fs: this.fs, dir: this.workDir, filepath: '.' });
  }

  private async _handleGitError(err: { name: string, message: string }): Promise<void> {
    const e: string = err.name;

    log.debug("Handling Git error", err);

    if (e.indexOf('FastForwardError') >= 0 || e.indexOf('MergeNotSupportedError') >= 0) {
      // NOTE: There’s also PushRejectedNonFastForward, but it seems to be thrown
      // for unrelated cases during push (false positive).
      // Because of that false positive, we ignore that error and instead do pull first,
      // catching actual fast-forward fails on that step before push.
      await this.setStatus({ statusRelativeToLocal: 'diverged' });
    } else if (e.indexOf('MissingNameError') >= 0) {
      await this.setStatus({ isMisconfigured: true });
    } else if (e.indexOf('EHOSTDOWN') >= 0) {
      await this.setStatus({ isOnline: false });
      log.warn("Possible connection issues");
    } else if (e.indexOf('UserCanceledError') >= 0) {
      log.warn("Probably password input required");
      await this.setPassword(undefined);
    }
  }
}


// async function checkOnlineStatus(timeout = 4500): Promise<boolean> {
//   // TODO: Move to general utility functions
//   return new Promise((resolve) => {
//     log.debug("C/db/isogit: Connection test: Starting");
//
//     const req = https.get('https://github.com/', { timeout }, reportOnline);
//
//     req.on('error', () => req.abort());
//     req.on('response', reportOnline);
//     req.on('connect', reportOnline);
//     req.on('continue', reportOnline);
//     req.on('upgrade', reportOnline);
//     req.on('timeout', reportOffline);
//
//     req.end();
//
//     const checkTimeout = setTimeout(reportOffline, timeout);
//
//     function reportOffline() {
//       log.warn("C/db/isogit: Connection test: Report offline");
//       try { req.abort(); } catch (e) {}
//       clearTimeout(checkTimeout);
//       resolve(false);
//     }
//     function reportOnline() {
//       log.info("C/db/isogit: Connection test: Report online");
//       try { req.abort(); } catch (e) {}
//       clearTimeout(checkTimeout);
//       resolve(true);
//     }
//   });
// }


export function isGitError(e: Error & { code: string }) {
  if (!e.code) {
    return false;
  }
  return Object.values(Errors).filter(gitE => gitE?.code === e.code) !== undefined;
}
