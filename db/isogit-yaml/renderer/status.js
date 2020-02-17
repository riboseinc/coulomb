import React, { useEffect, useState } from 'react';
import { Button, FormGroup, InputGroup, Popover, Position, ButtonGroup } from '@blueprintjs/core';
import { openWindow } from '../../../api_legacy/renderer';
import { callIPC, useIPCValue } from '../../../ipc/renderer';
import styles from './status.scss';
const BackendDetails = function ({ dbIPCPrefix, status, description }) {
    const ipcPrefix = dbIPCPrefix;
    const numUncommitted = useIPCValue(`${ipcPrefix}-count-uncommitted`, { numUncommitted: 0 }).
        value.numUncommitted;
    useEffect(() => {
        openPasswordPrompt(status.needsPassword);
    }, [status.needsPassword]);
    const [passwordPromptIsOpen, openPasswordPrompt] = useState(false);
    async function setPassword(password) {
        await callIPC(`${ipcPrefix}-git-set-password`, { password });
    }
    return (React.createElement(Popover, { boundary: "viewport", isOpen: passwordPromptIsOpen, position: Position.BOTTOM, targetTagName: "div", targetClassName: styles.base, content: React.createElement(PasswordPrompt, { onConfirm: async (password) => {
                setPassword(password);
                openPasswordPrompt(false);
            } }) },
        React.createElement(ButtonGroup, { fill: true, vertical: true, alignText: "left" },
            React.createElement(Button, { className: styles.sourceInfo, title: `${description.gitUsername}@${description.gitRepo}`, icon: "git-repo", onClick: () => {
                    if (description.gitRepo) {
                        require('electron').shell.openExternal(description.gitRepo);
                    }
                } },
                description.gitUsername,
                "@",
                description.gitRepo),
            React.createElement(ActionableStatus, { status: status, uncommittedFileCount: numUncommitted, onRequestSync: async () => await callIPC(`${ipcPrefix}-git-trigger-sync`), onDiscardUnstaged: async () => await callIPC(`${ipcPrefix}-git-discard-unstaged`), onPromptPassword: () => openPasswordPrompt(true), onShowCommitWindow: () => openWindow('batch-commit'), onShowSettingsWindow: () => openWindow('settings') }))));
};
export default BackendDetails;
const ActionableStatus = function ({ status, uncommittedFileCount, onRequestSync, onDiscardUnstaged, onPromptPassword, onShowCommitWindow, onShowSettingsWindow }) {
    let statusIcon;
    let tooltipText;
    let statusIntent;
    let action;
    if (status.isMisconfigured) {
        statusIcon = "error";
        tooltipText = "Configure";
        statusIntent = "danger";
        action = onShowSettingsWindow;
    }
    else if (status.isOnline !== true) {
        statusIcon = "offline";
        tooltipText = "Offline";
        statusIntent = "danger";
        action = status.needsPassword ? onPromptPassword : onRequestSync;
    }
    else if (status.needsPassword) {
        statusIcon = "lock";
        tooltipText = "Provide password";
        statusIntent = "primary";
        action = onPromptPassword;
    }
    else if (status.hasLocalChanges) {
        statusIcon = "git-commit";
        tooltipText = "Commit outstanding";
        statusIntent = "warning";
        action = async () => {
            if (status.hasLocalChanges && uncommittedFileCount < 1) {
                // NOTE: If hasLocalChanges says yes, but uncommitted file count says no, try to fix it.
                await onDiscardUnstaged();
                await onRequestSync();
            }
            else {
                onShowCommitWindow();
            }
        };
    }
    else if (status.isPulling) {
        statusIcon = "cloud-download";
        tooltipText = "Synchronizing";
        statusIntent = "primary";
        action = null;
    }
    else if (status.isPushing) {
        statusIcon = "cloud-upload";
        tooltipText = "Synchronizing";
        statusIntent = "primary";
        action = null;
    }
    else if (status.statusRelativeToLocal === 'diverged') {
        statusIcon = "git-branch";
        tooltipText = "Diverging changes";
        statusIntent = "danger";
        action = onRequestSync;
    }
    else if (status.statusRelativeToLocal === 'behind') {
        statusIcon = "cloud-upload";
        tooltipText = "Online";
        statusIntent = "warning";
        action = onRequestSync;
    }
    else {
        statusIcon = "updated";
        tooltipText = "Online";
        statusIntent = "success";
        action = onRequestSync;
    }
    return (React.createElement(Button, { className: styles.backendStatus, onClick: action || (() => { }), icon: statusIcon, intent: statusIntent, disabled: action === null, loading: action === null }, tooltipText));
};
const PasswordPrompt = function ({ onConfirm }) {
    const [value, setValue] = useState('');
    return React.createElement("div", { className: styles.passwordPrompt },
        React.createElement(FormGroup, { label: "Please enter repository password:", helperText: "The password will be kept in memory and not stored to disk." },
            React.createElement(InputGroup, { type: "password", value: value, onChange: (event) => setValue(event.target.value), leftIcon: "key", rightElement: value.trim() === ''
                    ? undefined
                    : React.createElement(Button, { minimal: true, onClick: async () => await onConfirm(value), icon: "tick", intent: "primary" }, "Confirm") })));
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2RiL2lzb2dpdC15YW1sL3JlbmRlcmVyL3N0YXR1cy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLEVBQUUsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLE1BQU0sT0FBTyxDQUFDO0FBRW5ELE9BQU8sRUFBRSxNQUFNLEVBQVksU0FBUyxFQUFFLFVBQVUsRUFBVSxPQUFPLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBRXBILE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUMxRCxPQUFPLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBSzdELE9BQU8sTUFBTSxNQUFNLGVBQWUsQ0FBQztBQUduQyxNQUFNLGNBQWMsR0FDcEIsVUFBVSxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFO0lBQzVDLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQztJQUU5QixNQUFNLGNBQWMsR0FDbEIsV0FBVyxDQUFDLEdBQUcsU0FBUyxvQkFBb0IsRUFBRSxFQUFFLGNBQWMsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUNwRSxLQUFLLENBQUMsY0FBYyxDQUFDO0lBRXZCLFNBQVMsQ0FBQyxHQUFHLEVBQUU7UUFDYixrQkFBa0IsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDM0MsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7SUFFM0IsTUFBTSxDQUFDLG9CQUFvQixFQUFFLGtCQUFrQixDQUFDLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRW5FLEtBQUssVUFBVSxXQUFXLENBQUMsUUFBZ0I7UUFDekMsTUFBTSxPQUFPLENBQTBDLEdBQUcsU0FBUyxtQkFBbUIsRUFBRSxFQUFFLFFBQVEsRUFBRSxD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QUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxNQUFNLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFDM0MsSUFBSSxFQUFDLE1BQU0sRUFDWCxNQUFNLEVBQUMsU0FBUyxjQUVYLEdBQ2IsQ0FDUSxDQUNSLENBQUM7QUFDVCxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcblxuaW1wb3J0IHsgQnV0dG9uLCBJY29uTmFtZSwgRm9ybUdyb3VwLCBJbnB1dEdyb3VwLCBJbnRlbnQsIFBvcG92ZXIsIFBvc2l0aW9uLCBCdXR0b25Hcm91cCB9IGZyb20gJ0BibHVlcHJpbnRqcy9jb3JlJztcblxuaW1wb3J0IHsgb3BlbldpbmRvdyB9IGZyb20gJy4uLy4uLy4uL2FwaV9sZWdhY3kvcmVuZGVyZXInO1xuaW1wb3J0IHsgY2FsbElQQywgdXNlSVBDVmFsdWUgfSBmcm9tICcuLi8uLi8uLi9pcGMvcmVuZGVyZXInO1xuXG5pbXBvcnQgeyBEYXRhYmFzZVN0YXR1c0NvbXBvbmVudFByb3BzIH0gZnJvbSAnLi4vLi4vLi4vY29uZmlnL3JlbmRlcmVyJztcbmltcG9ydCB7IEJhY2tlbmREZXNjcmlwdGlvbiwgQmFja2VuZFN0YXR1cyB9IGZyb20gJy4uL2Jhc2UnO1xuXG5pbXBvcnQgc3R5bGVzIGZyb20gJy4vc3RhdHVzLnNjc3MnO1xuXG5cbmNvbnN0IEJhY2tlbmREZXRhaWxzOiBSZWFjdC5GQzxEYXRhYmFzZVN0YXR1c0NvbXBvbmVudFByb3BzPEJhY2tlbmREZXNjcmlwdGlvbiwgQmFja2VuZFN0YXR1cz4+ID1cbmZ1bmN0aW9uICh7IGRiSVBDUHJlZml4LCBzdGF0dXMsIGRlc2NyaXB0aW9uIH0pIHtcbiAgY29uc3QgaXBjUHJlZml4ID0gZGJJUENQcmVmaXg7XG5cbiAgY29uc3QgbnVtVW5jb21taXR0ZWQgPSBcbiAgICB1c2VJUENWYWx1ZShgJHtpcGNQcmVmaXh9LWNvdW50LXVuY29tbWl0dGVkYCwgeyBudW1VbmNvbW1pdHRlZDogMCB9KS5cbiAgICB2YWx1ZS5udW1VbmNvbW1pdHRlZDtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIG9wZW5QYXNzd29yZFByb21wdChzdGF0dXMubmVlZHNQYXNzd29yZCk7XG4gIH0sIFtzdGF0dXMubmVlZHNQYXNzd29yZF0pO1xuXG4gIGNvbnN0IFtwYXNzd29yZFByb21wdElzT3Blbiwgb3BlblBhc3N3b3JkUHJvbXB0XSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICBhc3luYyBmdW5jdGlvbiBzZXRQYXNzd29yZChwYXNzd29yZDogc3RyaW5nKSB7XG4gICAgYXdhaXQgY2FsbElQQzx7IHBhc3N3b3JkOiBzdHJpbmcgfSwgeyBzdWNjZXNzOiB0cnVlIH0+KGAke2lwY1ByZWZpeH0tZ2l0LXNldC1wYXNzd29yZGAsIHsgcGFzc3dvcmQgfSk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxQb3BvdmVyXG4gICAgICAgIGJvdW5kYXJ5PVwidmlld3BvcnRcIlxuICAgICAgICBpc09wZW49e3Bhc3N3b3JkUHJvbXB0SXNPcGVufVxuICAgICAgICBwb3NpdGlvbj17UG9zaXRpb24uQk9UVE9NfVxuICAgICAgICB0YXJnZXRUYWdOYW1lPVwiZGl2XCJcbiAgICAgICAgdGFyZ2V0Q2xhc3NOYW1lPXtzdHlsZXMuYmFzZX1cbiAgICAgICAgY29udGVudD17XG4gICAgICAgICAgPFBhc3N3b3JkUHJvbXB0IG9uQ29uZmlybT17YXN5bmMgKHBhc3N3b3JkKSA9PiB7XG4gICAgICAgICAgICBzZXRQYXNzd29yZChwYXNzd29yZCk7XG4gICAgICAgICAgICBvcGVuUGFzc3dvcmRQcm9tcHQoZmFsc2UpO1xuICAgICAgICAgIH19IC8+XG4gICAgICAgIH0+XG4gICAgICA8QnV0dG9uR3JvdXAgZmlsbCB2ZXJ0aWNhbCBhbGlnblRleHQ9XCJsZWZ0XCI+XG4gICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgIGNsYXNzTmFtZT17c3R5bGVzLnNvdXJjZUluZm99XG4gICAgICAgICAgICB0aXRsZT17YCR7ZGVzY3JpcHRpb24uZ2l0VXNlcm5hbWV9QCR7ZGVzY3JpcHRpb24uZ2l0UmVwb31gfVxuICAgICAgICAgICAgaWNvbj1cImdpdC1yZXBvXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGRlc2NyaXB0aW9uLmdpdFJlcG8pIHtcbiAgICAgICAgICAgICAgICByZXF1aXJlKCdlbGVjdHJvbicpLnNoZWxsLm9wZW5FeHRlcm5hbChkZXNjcmlwdGlvbi5naXRSZXBvKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfX0+XG4gICAgICAgICAge2Rlc2NyaXB0aW9uLmdpdFVzZXJuYW1lfUB7ZGVzY3JpcHRpb24uZ2l0UmVwb31cbiAgICAgICAgPC9CdXR0b24+XG5cbiAgICAgICAgPEFjdGlvbmFibGVTdGF0dXNcbiAgICAgICAgICBzdGF0dXM9e3N0YXR1c31cbiAgICAgICAgICB1bmNvbW1pdHRlZEZpbGVDb3VudD17bnVtVW5jb21taXR0ZWR9XG4gICAgICAgICAgb25SZXF1ZXN0U3luYz17YXN5bmMgKCkgPT4gYXdhaXQgY2FsbElQQyhgJHtpcGNQcmVmaXh9LWdpdC10cmlnZ2VyLXN5bmNgKX1cbiAgICAgICAgICBvbkRpc2NhcmRVbnN0YWdlZD17YXN5bmMgKCkgPT4gYXdhaXQgY2FsbElQQyhgJHtpcGNQcmVmaXh9LWdpdC1kaXNjYXJkLXVuc3RhZ2VkYCl9XG4gICAgICAgICAgb25Qcm9tcHRQYXNzd29yZD17KCkgPT4gb3BlblBhc3N3b3JkUHJvbXB0KHRydWUpfVxuICAgICAgICAgIG9uU2hvd0NvbW1pdFdpbmRvdz17KCkgPT4gb3BlbldpbmRvdygnYmF0Y2gtY29tbWl0Jyl9XG4gICAgICAgICAgb25TaG93U2V0dGluZ3NXaW5kb3c9eygpID0+IG9wZW5XaW5kb3coJ3NldHRpbmdzJyl9XG4gICAgICAgIC8+XG4gICAgICA8L0J1dHRvbkdyb3VwPlxuICAgIDwvUG9wb3Zlcj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEJhY2tlbmREZXRhaWxzO1xuXG5cbmludGVyZmFjZSBBY3Rpb25hYmxlU3RhdHVzUHJvcHMge1xuICBzdGF0dXM6IEJhY2tlbmRTdGF0dXNcbiAgdW5jb21taXR0ZWRGaWxlQ291bnQ6IG51bWJlclxuICBvblJlcXVlc3RTeW5jOiAoKSA9PiBQcm9taXNlPHZvaWQ+XG4gIG9uRGlzY2FyZFVuc3RhZ2VkOiAoKSA9PiBQcm9taXNlPHZvaWQ+XG4gIG9uUHJvbXB0UGFzc3dvcmQ6ICgpID0+IHZvaWRcbiAgb25TaG93Q29tbWl0V2luZG93OiAoKSA9PiB2b2lkXG4gIG9uU2hvd1NldHRpbmdzV2luZG93OiAoKSA9PiB2b2lkXG59XG5jb25zdCBBY3Rpb25hYmxlU3RhdHVzOiBSZWFjdC5GQzxBY3Rpb25hYmxlU3RhdHVzUHJvcHM+ID0gZnVuY3Rpb24gKHtcbiAgICBzdGF0dXMsIHVuY29tbWl0dGVkRmlsZUNvdW50LFxuICAgIG9uUmVxdWVzdFN5bmMsIG9uRGlzY2FyZFVuc3RhZ2VkLFxuICAgIG9uUHJvbXB0UGFzc3dvcmQsXG4gICAgb25TaG93Q29tbWl0V2luZG93LCBvblNob3dTZXR0aW5nc1dpbmRvdyB9KSB7XG5cbiAgbGV0IHN0YXR1c0ljb246IEljb25OYW1lO1xuICBsZXQgdG9vbHRpcFRleHQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgbGV0IHN0YXR1c0ludGVudDogSW50ZW50O1xuICBsZXQgYWN0aW9uOiBudWxsIHwgKCgpID0+IHZvaWQpO1xuXG4gIGlmIChzdGF0dXMuaXNNaXNjb25maWd1cmVkKSB7XG4gICAgc3RhdHVzSWNvbiA9IFwiZXJyb3JcIjtcbiAgICB0b29sdGlwVGV4dCA9IFwiQ29uZmlndXJlXCI7XG4gICAgc3RhdHVzSW50ZW50ID0gXCJkYW5nZXJcIjtcbiAgICBhY3Rpb24gPSBvblNob3dTZXR0aW5nc1dpbmRvdztcblxuICB9IGVsc2UgaWYgKHN0YXR1cy5pc09ubGluZSAhPT0gdHJ1ZSkge1xuICAgIHN0YXR1c0ljb24gPSBcIm9mZmxpbmVcIjtcbiAgICB0b29sdGlwVGV4dCA9IFwiT2ZmbGluZVwiXG4gICAgc3RhdHVzSW50ZW50ID0gXCJkYW5nZXJcIjtcbiAgICBhY3Rpb24gPSBzdGF0dXMubmVlZHNQYXNzd29yZCA/IG9uUHJvbXB0UGFzc3dvcmQgOiBvblJlcXVlc3RTeW5jO1xuXG4gIH0gZWxzZSBpZiAoc3RhdHVzLm5lZWRzUGFzc3dvcmQpIHtcbiAgICBzdGF0dXNJY29uID0gXCJsb2NrXCI7XG4gICAgdG9vbHRpcFRleHQgPSBcIlByb3ZpZGUgcGFzc3dvcmRcIjtcbiAgICBzdGF0dXNJbnRlbnQgPSBcInByaW1hcnlcIjtcbiAgICBhY3Rpb24gPSBvblByb21wdFBhc3N3b3JkO1xuXG4gIH0gZWxzZSBpZiAoc3RhdHVzLmhhc0xvY2FsQ2hhbmdlcykge1xuICAgIHN0YXR1c0ljb24gPSBcImdpdC1jb21taXRcIjtcbiAgICB0b29sdGlwVGV4dCA9IFwiQ29tbWl0IG91dHN0YW5kaW5nXCI7XG4gICAgc3RhdHVzSW50ZW50ID0gXCJ3YXJuaW5nXCI7XG4gICAgYWN0aW9uID0gYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKHN0YXR1cy5oYXNMb2NhbENoYW5nZXMgJiYgdW5jb21taXR0ZWRGaWxlQ291bnQgPCAxKSB7XG4gICAgICAgIC8vIE5PVEU6IElmIGhhc0xvY2FsQ2hhbmdlcyBzYXlzIHllcywgYnV0IHVuY29tbWl0dGVkIGZpbGUgY291bnQgc2F5cyBubywgdHJ5IHRvIGZpeCBpdC5cbiAgICAgICAgYXdhaXQgb25EaXNjYXJkVW5zdGFnZWQoKTtcbiAgICAgICAgYXdhaXQgb25SZXF1ZXN0U3luYygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb25TaG93Q29tbWl0V2luZG93KCk7XG4gICAgICB9XG4gICAgfVxuXG4gIH0gZWxzZSBpZiAoc3RhdHVzLmlzUHVsbGluZykge1xuICAgIHN0YXR1c0ljb24gPSBcImNsb3VkLWRvd25sb2FkXCJcbiAgICB0b29sdGlwVGV4dCA9IFwiU3luY2hyb25pemluZ1wiO1xuICAgIHN0YXR1c0ludGVudCA9IFwicHJpbWFyeVwiO1xuICAgIGFjdGlvbiA9IG51bGw7XG5cbiAgfSBlbHNlIGlmIChzdGF0dXMuaXNQdXNoaW5nKSB7XG4gICAgc3RhdHVzSWNvbiA9IFwiY2xvdWQtdXBsb2FkXCJcbiAgICB0b29sdGlwVGV4dCA9IFwiU3luY2hyb25pemluZ1wiO1xuICAgIHN0YXR1c0ludGVudCA9IFwicHJpbWFyeVwiO1xuICAgIGFjdGlvbiA9IG51bGw7XG5cbiAgfSBlbHNlIGlmIChzdGF0dXMuc3RhdHVzUmVsYXRpdmVUb0xvY2FsID09PSAnZGl2ZXJnZWQnKSB7XG4gICAgc3RhdHVzSWNvbiA9IFwiZ2l0LWJyYW5jaFwiXG4gICAgdG9vbHRpcFRleHQgPSBcIkRpdmVyZ2luZyBjaGFuZ2VzXCI7XG4gICAgc3RhdHVzSW50ZW50ID0gXCJkYW5nZXJcIjtcbiAgICBhY3Rpb24gPSBvblJlcXVlc3RTeW5jO1xuXG4gIH0gZWxzZSBpZiAoc3RhdHVzLnN0YXR1c1JlbGF0aXZlVG9Mb2NhbCA9PT0gJ2JlaGluZCcpIHtcbiAgICBzdGF0dXNJY29uID0gXCJjbG91ZC11cGxvYWRcIlxuICAgIHRvb2x0aXBUZXh0ID0gXCJPbmxpbmVcIjtcbiAgICBzdGF0dXNJbnRlbnQgPSBcIndhcm5pbmdcIjtcbiAgICBhY3Rpb24gPSBvblJlcXVlc3RTeW5jO1xuXG4gIH0gZWxzZSB7XG4gICAgc3RhdHVzSWNvbiA9IFwidXBkYXRlZFwiXG4gICAgdG9vbHRpcFRleHQgPSBcIk9ubGluZVwiO1xuICAgIHN0YXR1c0ludGVudCA9IFwic3VjY2Vzc1wiO1xuICAgIGFjdGlvbiA9IG9uUmVxdWVzdFN5bmM7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxCdXR0b25cbiAgICAgICAgY2xhc3NOYW1lPXtzdHlsZXMuYmFja2VuZFN0YXR1c31cbiAgICAgICAgb25DbGljaz17YWN0aW9uIHx8ICgoKSA9PiB7fSl9XG4gICAgICAgIGljb249e3N0YXR1c0ljb259XG4gICAgICAgIGludGVudD17c3RhdHVzSW50ZW50fVxuICAgICAgICBkaXNhYmxlZD17YWN0aW9uID09PSBudWxsfVxuICAgICAgICBsb2FkaW5nPXthY3Rpb24gPT09IG51bGx9PlxuICAgICAge3Rvb2x0aXBUZXh0fVxuICAgIDwvQnV0dG9uPlxuICApO1xufTtcblxuXG5jb25zdCBQYXNzd29yZFByb21wdDogUmVhY3QuRkM8eyBvbkNvbmZpcm06ICh2YWx1ZTogc3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+IH0+ID0gZnVuY3Rpb24gKHsgb25Db25maXJtIH0pIHtcbiAgY29uc3QgW3ZhbHVlLCBzZXRWYWx1ZV0gPSB1c2VTdGF0ZSgnJyk7XG5cbiAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMucGFzc3dvcmRQcm9tcHR9PlxuICAgIDxGb3JtR3JvdXBcbiAgICAgICAgbGFiZWw9XCJQbGVhc2UgZW50ZXIgcmVwb3NpdG9yeSBwYXNzd29yZDpcIlxuICAgICAgICBoZWxwZXJUZXh0PVwiVGhlIHBhc3N3b3JkIHdpbGwgYmUga2VwdCBpbiBtZW1vcnkgYW5kIG5vdCBzdG9yZWQgdG8gZGlzay5cIj5cbiAgICAgIDxJbnB1dEdyb3VwXG4gICAgICAgIHR5cGU9XCJwYXNzd29yZFwiXG4gICAgICAgIHZhbHVlPXt2YWx1ZX1cbiAgICAgICAgb25DaGFuZ2U9eyhldmVudDogUmVhY3QuRm9ybUV2ZW50PEhUTUxFbGVtZW50PikgPT4gc2V0VmFsdWUoKGV2ZW50LnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZSl9XG4gICAgICAgIGxlZnRJY29uPVwia2V5XCJcbiAgICAgICAgcmlnaHRFbGVtZW50PXtcbiAgICAgICAgICB2YWx1ZS50cmltKCkgPT09ICcnXG4gICAgICAgICAgPyB1bmRlZmluZWRcbiAgICAgICAgICA6IDxCdXR0b25cbiAgICAgICAgICAgICAgICBtaW5pbWFsXG4gICAgICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4gYXdhaXQgb25Db25maXJtKHZhbHVlKX1cbiAgICAgICAgICAgICAgICBpY29uPVwidGlja1wiXG4gICAgICAgICAgICAgICAgaW50ZW50PVwicHJpbWFyeVwiPlxuICAgICAgICAgICAgICBDb25maXJtXG4gICAgICAgICAgICA8L0J1dHRvbj59XG4gICAgICAvPlxuICAgIDwvRm9ybUdyb3VwPlxuICA8L2Rpdj47XG59O1xuIl19