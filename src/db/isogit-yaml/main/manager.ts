import * as path from 'path';

import { listen } from '../../../ipc/main';

import { ModelInfo } from '../../../config/app';

import {
  ManagerClass as BaseManagerClass,
  ManagerOptions as BaseManagerOptions,
} from '../../../config/main';

import { Model, AnyIDType } from '../../models';
import { Index } from '../../query';
import { default as Backend } from './base';
import { ModelManager, FilesystemManager, CommitError, ManagedDataChangeReporter } from '../../main/base';

import { isGitError } from './isogit/base';


export interface ManagerOptions<M extends Model> extends BaseManagerOptions<M> {
  // Path to data for this model, relative to DB’s work directory
  workDir: string

  // List of fields that go into meta.yaml
  metaFields?: (keyof M)[]

  // Name of model field containing unqiue identifier equivalent
  idField: keyof M
}


class Manager<M extends Model, IDType extends AnyIDType>
extends ModelManager<M, IDType> implements FilesystemManager {

  constructor(
      private db: Backend,
      private managerConfig: ManagerOptions<M>,
      private modelInfo: ModelInfo,
      private reportUpdatedData: ManagedDataChangeReporter<IDType>) {
    super();

    db.registerManager(this as FilesystemManager);
  }

  public managesFileAtPath(filePath: string) {
    return true;
  }


  // CRUD methods

  public async create(obj: M, commit: boolean | string = false) {
    const objID = obj[this.managerConfig.idField];
    await this.db.create(obj, this.getDBRef(objID), this.managerConfig.metaFields);

    if (commit !== false) {
      await this.commitOne(
        objID,
        commit !== true ? commit : null,
        'create');
      await this.reportUpdatedData([objID]);
    }
  }

  public async read(objID: IDType) {
    return await this.db.read(
      this.getDBRef(objID),
      this.managerConfig.metaFields ? (this.managerConfig.metaFields as string[]) : undefined) as M;
  }

  public async commit(objIDs: IDType[], message: string) {
    if (objIDs.length > 0) {
      await this.db.commit(objIDs.map(objID => this.getDBRef(objID)), message);
      await this.reportUpdatedData(objIDs);
    }
  }

  public async discard(objIDs: IDType[]) {
    if (objIDs.length > 0) {
      await this.db.discard(objIDs.map(objID => this.getDBRef(objID)));
      await this.reportUpdatedData(objIDs);
    }
  }

  public async listUncommitted() {
    if (this.db.listUncommitted) {  
      const dbRefs = await this.db.listUncommitted();

      const objIDs: IDType[] = dbRefs.
        filter(ref => this.managesFileAtPath(ref)).
        map(ref => this.getObjID(ref));

      return objIDs.filter(function (objID, idx, self) {
        // Discard duplicates from the list
        return idx === self.indexOf(objID);
      });
    } else {
      throw new Error("listUncommitted() is not implemented by DB backend");
    }
  }

  public async readAll() {
    var idx: Index<M> = await this.db.getIndex(
      this.managerConfig.idField as string,
      this.managerConfig.workDir);
    return idx;
  }

  public async update(objID: IDType, newData: M, commit: boolean | string = false) {
    if (objID !== newData[this.managerConfig.idField]) {
      throw new Error("Updating object IDs is not supported at the moment.");
    }

    await this.db.update(this.getDBRef(objID), newData, this.managerConfig.idField as string);

    if (commit !== false) {
      await this.commitOne(
        objID,
        commit !== true ? commit : null,
        'update',
        newData);
      await this.reportUpdatedData([objID]);
    }
  }

  public async delete(objID: IDType, commit: string | boolean = false) {
    await this.db.delete(this.getDBRef(objID));

    if (commit !== false) {
      await this.commitOne(
        objID,
        commit !== true ? commit : null,
        'delete');
      await this.reportUpdatedData([objID]);
    }
  }

  private async commitOne(objID: IDType, commitMessage: string | null, verb: string, obj?: M) {
    try {
      await this.db.commit(
        [this.getDBRef(objID)],
        commitMessage !== null
          ? commitMessage
          : this.formatCommitMessage(verb, objID, obj));

    } catch (e) {
      // TODO: This is the only thing that makes this manager Git-specific.
      // Get rid of it and make it generic!
      if (isGitError(e)) {
        throw new CommitError(e.code, e.message);
      } else {
        throw e;
      }
    }
  }

  private formatObjectName(objID: IDType, obj?: M) {
    return `${objID}`;
  }

  private formatCommitMessage(verb: string, objID: IDType, obj?: M) {
    return `${verb} ${this.modelInfo.shortName} ${this.formatObjectName(objID, obj)}`;
  }

  private getDBRef(objID: IDType): string {
    /* Returns DB backend’s full ID given object ID. */
    return path.join(this.managerConfig.workDir, `${objID}`);
  }

  public getObjID(dbRef: string) {
    if (path.isAbsolute(dbRef)) {
      throw new Error("getObjID() received dbRef which is an absolute filesystem path");
    }
    const relativeRef = path.relative(this.managerConfig.workDir, dbRef);
    const baseComponent = relativeRef.split(path.sep)[0];

    // if (!objId || !(await this.isValidId(objId))) {
    //   throw new Error(`Unable to resolve object ID for path ${filepath}`);
    // }

    return baseComponent as IDType;
  }

  public setUpIPC(modelName: string) {
    super.setUpIPC(modelName);

    const prefix = `model-${modelName}`;

    listen<{}, IDType[]>
    (`${prefix}-read-uncommitted-ids`, async () => {
      return await this.listUncommitted();
    });

    listen<
      { objectIDs: IDType[], commitMessage: string },
      { success: true }>
    (`${prefix}-commit-objects`, async ({ objectIDs, commitMessage }) => {
      await this.commit(objectIDs, commitMessage);
      return { success: true };
    });

    listen<{ objectIDs: IDType[] }, { success: true }>
    (`${prefix}-discard-all-uncommitted`, async ({ objectIDs }) => {
      await this.discard(objectIDs);
      return { success: true };
    });
  }
}

export const ManagerClass: BaseManagerClass<any, any, ManagerOptions<any>, Backend> = Manager;

export default Manager;
