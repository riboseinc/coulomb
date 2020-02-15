import React, { useEffect, useState } from 'react';
import { Button, FormGroup, InputGroup, Popover, Position } from '@blueprintjs/core';
import { openWindow } from '../../../api_legacy/renderer';
import { callIPC, useIPCValue } from '../../../ipc/renderer';
import styles from './status.scss';
const BackendDetails = function ({ dbIPCPrefix, status, description }) {
    const ipcPrefix = dbIPCPrefix;
    useEffect(() => {
        openPasswordPrompt(status.needsPassword);
    }, [status.needsPassword]);
    const [passwordPromptIsOpen, openPasswordPrompt] = useState(false);
    async function setPassword(password) {
        await callIPC(`${ipcPrefix}-git-set-password`, { password });
    }
    return (React.createElement("div", { className: styles.base },
        React.createElement(Button, { minimal: true, small: true, className: styles.sourceInfo, onClick: () => callIPC('open-arbitrary-window', {
                url: description.gitRepo,
                title: "Git repository"
            }) },
            description.gitUsername,
            "@",
            description.gitRepo),
        React.createElement(Popover, { minimal: true, content: React.createElement(PasswordPrompt, { onConfirm: async (password) => { await setPassword(password); openPasswordPrompt(false); } }), position: Position.TOP_RIGHT, isOpen: passwordPromptIsOpen },
            React.createElement(ActionableStatus, { status: status, uncommittedFileCount: useIPCValue(`${ipcPrefix}-count-uncommitted`, { numUncommitted: 0 }).
                    value.numUncommitted, onRequestSync: async () => await callIPC(`${ipcPrefix}-git-trigger-sync`), onDiscardUnstaged: async () => await callIPC(`${ipcPrefix}-git-discard-unstaged`), onTogglePasswordPrompt: () => openPasswordPrompt(!passwordPromptIsOpen), onShowCommitWindow: () => openWindow('batch-commit'), onShowSettingsWindow: () => openWindow('settings') }))));
};
export default BackendDetails;
const ActionableStatus = function ({ status, uncommittedFileCount, onRequestSync, onDiscardUnstaged, onTogglePasswordPrompt, onShowCommitWindow, onShowSettingsWindow }) {
    let statusIcon;
    let tooltipText;
    let statusIntent;
    let action;
    if (status.isMisconfigured) {
        statusIcon = "error";
        tooltipText = "Configuration required; click to resolve";
        statusIntent = "danger";
        action = onShowSettingsWindow;
    }
    else if (status.isOnline !== true) {
        statusIcon = "offline";
        tooltipText = "Offline";
        statusIntent = "danger";
        action = onRequestSync;
    }
    else if (status.needsPassword) {
        statusIcon = "lock";
        tooltipText = "Password required";
        statusIntent = "primary";
        action = onTogglePasswordPrompt;
    }
    else if (status.hasLocalChanges) {
        statusIcon = "git-commit";
        tooltipText = "Uncommitted changes; click to resolve";
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
        tooltipText = "Diverging changes present; click to retry";
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
    return (React.createElement(Button, { className: styles.backendStatus, onClick: action || (() => { }), small: true, minimal: true, icon: statusIcon, intent: statusIntent, disabled: action === null, loading: action === null }, tooltipText));
};
const PasswordPrompt = function ({ onConfirm }) {
    const [value, setValue] = useState('');
    return React.createElement("div", { className: styles.passwordPrompt },
        React.createElement(FormGroup, { label: "Please enter repository password:", helperText: "The password will be kept in memory and not stored to disk." },
            React.createElement(InputGroup, { type: "password", value: value, onChange: (event) => setValue(event.target.value), leftIcon: "key", rightElement: value.trim() === ''
                    ? undefined
                    : React.createElement(Button, { minimal: true, onClick: async () => await onConfirm(value), icon: "tick", intent: "primary" }, "Confirm") })));
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2RiL2lzb2dpdC15YW1sL3JlbmRlcmVyL3N0YXR1cy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLEVBQUUsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLE1BQU0sT0FBTyxDQUFDO0FBRW5ELE9BQU8sRUFBRSxNQUFNLEVBQXFCLFNBQVMsRUFBRSxVQUFVLEVBQWdCLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUV0SCxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFDMUQsT0FBTyxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUs3RCxPQUFPLE1BQU0sTUFBTSxlQUFlLENBQUM7QUFHbkMsTUFBTSxjQUFjLEdBQ3BCLFVBQVUsRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRTtJQUM1QyxNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUM7SUFFOUIsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNiLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUMzQyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUUzQixNQUFNLENBQUMsb0JBQW9CLEVBQUUsa0JBQWtCLENBQUMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFbkUsS0FBSyxVQUFVLFdBQVcsQ0FBQyxRQUFnQjtRQUN6QyxNQUFNLE9BQU8sQ0FBMEMsR0FBRyxTQUFTLG1CQUFtQixFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUN4RyxDQUFDO0lBRUQsT0FBTyxDQUNMLDZCQUFLLFNBQVMsRUFBRSxNQUFNLENBQUMsSUFBSTtRQUN6QixvQkFBQyxNQUFNLElBQ0gsT0FBTyxFQUFFLElBQUksRUFDYixLQUFLLEVBQUUsSUFBSSxFQUNYLFNBQVMsRUFBRSxNQUFNLENBQUMsVUFBVSxFQUM1QixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLHVCQUF1QixFQUFFO2dCQUM5QyxHQUFHLEVBQUUsV0FBVyxDQUFDLE9BQU87Z0JBQ3hCLEtBQUssRUFBRSxnQkFBZ0I7YUFDeEIsQ0FBQztZQUNILFdBQVcsQ0FBQyxXQUFXOztZQUFHLFdBQVcsQ0FBQyxPQUFPLENBQ3ZDO1FBRVQsb0JBQUMsT0FBTyxJQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUMzQixvQkFBQyxjQUFjLElBQ2IsU0FBUyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRSxHQUFHLE1BQU0sV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUksRUFDOUYsUUFBUSxFQUFFLFFBQVEsQ0FBQyxTQUFTLEVBQzVCLE1BQU0sRUFBRSxvQkFBb0I7WUFDaEMsb0JBQUMsZ0JBQWdCLElBQ2YsTUFBTSxFQUFFLE1BQU0sRUFDZCxvQkFBb0IsRUFDbEIsV0FBVyxDQUFDLEdBQUcsU0FBUyxvQkFBb0IsRUFBRSxFQUFFLGNBQWMsRUFBRSxDQUFDLEVBQUUsQ0FBQztvQkFDcEUsS0FBSyxDQUFDLGNBQWMsRUFDdEIsYUFBYSxFQUFFLEtBQUssSUFBSSxFQUFFLENBQUMsTUFBTSxPQUFPLENBQUMsR0FBRyxTQUFTLG1CQUFtQixDQUFDLEVBQ3pFLGlCQUFpQixFQUFFLEtBQUssSUFBSSxFQUFFLENBQUMsTUFBTSxPQUFPLENBQUMsR0FBRyxTQUFTLHVCQUF1QixDQUFDLEVBQ2pGLHNCQUFzQixFQUFFLEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUFDLENBQUMsb0JBQW9CLENBQUMsRUFDdkUsa0JBQWtCLEVBQUUsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxFQUNwRCxvQkFBb0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEdBQ2xELENBQ00sQ0FDTixDQUNQLENBQUM7QUFDSixDQUFDLENBQUM7QUFFRixlQUFlLGNBQWMsQ0FBQztBQVk5QixNQUFNLGdCQUFnQixHQUFvQyxVQUFVLEVBQ2hFLE1BQU0sRUFBRSxvQkFBb0IsRUFDNUIsYUFBYSxFQUFFLGlCQUFpQixFQUNoQyxzQkFBc0IsRUFDdEIsa0JBQWtCLEVBQUUsb0JBQW9CLEVBQUU7SUFFNUMsSUFBSSxVQUFvQixDQUFDO0lBQ3pCLElBQUksV0FBK0IsQ0FBQztJQUNwQyxJQUFJLFlBQW9CLENBQUM7SUFDekIsSUFBSSxNQUEyQixDQUFDO0lBRWhDLElBQUksTUFBTSxDQUFDLGVBQWUsRUFBRTtRQUMxQixVQUFVLEdBQUcsT0FBTyxDQUFDO1FBQ3JCLFdBQVcsR0FBRywwQ0FBMEMsQ0FBQztRQUN6RCxZQUFZLEdBQUcsUUFBUSxDQUFDO1FBQ3hCLE1BQU0sR0FBRyxvQkFBb0IsQ0FBQztLQUUvQjtTQUFNLElBQUksTUFBTSxDQUFDLFFBQVEsS0FBSyxJQUFJLEVBQUU7UUFDbkMsVUFBVSxHQUFHLFNBQVMsQ0FBQztRQUN2QixXQUFXLEdBQUcsU0FBUyxDQUFBO1FBQ3ZCLFlBQVksR0FBRyxRQUFRLENBQUM7UUFDeEIsTUFBTSxHQUFHLGFBQWEsQ0FBQztLQUV4QjtTQUFNLElBQUksTUFBTSxDQUFDLGFBQWEsRUFBRTtRQUMvQixVQUFVLEdBQUcsTUFBTSxDQUFDO1FBQ3BCLFdBQVcsR0FBRyxtQkFBbUIsQ0FBQztRQUNsQyxZQUFZLEdBQUcsU0FBUyxDQUFDO1FBQ3pCLE1BQU0sR0FBRyxzQkFBc0IsQ0FBQztLQUVqQztTQUFNLElBQUksTUFBTSxDQUFDLGVBQWUsRUFBRTtRQUNqQyxVQUFVLEdBQUcsWUFBWSxDQUFDO1FBQzFCLFdBQVcsR0FBRyx1Q0FBdUMsQ0FBQztRQUN0RCxZQUFZLEdBQUcsU0FBUyxDQUFDO1FBQ3pCLE1BQU0sR0FBRyxLQUFLLElBQUksRUFBRTtZQUNsQixJQUFJLE1BQU0sQ0FBQyxlQUFlLElBQUksb0JBQW9CLEdBQUcsQ0FBQyxFQUFFO2dCQUN0RCx3RkFBd0Y7Z0JBQ3hGLE1BQU0saUJBQWlCLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxhQUFhLEVBQUUsQ0FBQzthQUN2QjtpQkFBTTtnQkFDTCxrQkFBa0IsRUFBRSxDQUFDO2FBQ3RCO1FBQ0gsQ0FBQyxDQUFBO0tBRUY7U0FBTSxJQUFJLE1BQU0sQ0FBQyxTQUFTLEVBQUU7UUFDM0IsVUFBVSxHQUFHLGdCQUFnQixDQUFBO1FBQzdCLFdBQVcsR0FBRyxlQUFlLENBQUM7UUFDOUIsWUFBWSxHQUFHLFNBQVMsQ0FBQztRQUN6QixNQUFNLEdBQUcsSUFBSSxDQUFDO0tBRWY7U0FBTSxJQUFJLE1BQU0sQ0FBQyxTQUFTLEVBQUU7UUFDM0IsVUFBVSxHQUFHLGNBQWMsQ0FBQTtRQUMzQixXQUFXLEdBQUcsZUFBZSxDQUFDO1FBQzlCLFlBQVksR0FBRyxTQUFTLENBQUM7UUFDekIsTUFBTSxHQUFHLElBQUksQ0FBQztLQUVmO1NBQU0sSUFBSSxNQUFNLENBQUMscUJBQXFCLEtBQUssVUFBVSxFQUFFO1FBQ3RELFVBQVUsR0FBRyxZQUFZLENBQUE7UUFDekIsV0FBVyxHQUFHLDJDQUEyQyxDQUFDO1FBQzFELFlBQVksR0FBRyxRQUFRLENBQUM7UUFDeEIsTUFBTSxHQUFHLGFBQWEsQ0FBQztLQUV4QjtTQUFNLElBQUksTUFBTSxDQUFDLHFCQUFxQixLQUFLLFFBQVEsRUFBRTtRQUNwRCxVQUFVLEdBQUcsY0FBYyxDQUFBO1FBQzNCLFdBQVcsR0FBRyxRQUFRLENBQUM7UUFDdkIsWUFBWSxHQUFHLFNBQVMsQ0FBQztRQUN6QixNQUFNLEdBQUcsYUFBYSxDQUFDO0tBRXhCO1NBQU07UUFDTCxVQUFVLEdBQUcsU0FBUyxDQUFBO1FBQ3RCLFdBQVcsR0FBRyxRQUFRLENBQUM7UUFDdkIsWUFBWSxHQUFHLFNBQVMsQ0FBQztRQUN6QixNQUFNLEdBQUcsYUFBYSxDQUFDO0tBQ3hCO0lBRUQsT0FBTyxDQUNMLG9CQUFDLE1BQU0sSUFDSCxTQUFTLEVBQUUsTUFBTSxDQUFDLGFBQWEsRUFDL0IsT0FBTyxFQUFFLE1BQU0sSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQyxFQUM3QixLQUFLLEVBQUUsSUFBSSxFQUNYLE9BQU8sRUFBRSxJQUFJLEVBQ2IsSUFBSSxFQUFFLFVBQVUsRUFDaEIsTUFBTSxFQUFFLFlBQVksRUFDcEIsUUFBUSxFQUFFLE1BQU0sS0FBSyxJQUFJLEVBQ3pCLE9BQU8sRUFBRSxNQUFNLEtBQUssSUFBSSxJQUN6QixXQUFXLENBQ0wsQ0FDVixDQUFDO0FBQ0osQ0FBQyxDQUFDO0FBR0YsTUFBTSxjQUFjLEdBQThELFVBQVUsRUFBRSxTQUFTLEVBQUU7SUFDdkcsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsR0FBRyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFdkMsT0FBTyw2QkFBSyxTQUFTLEVBQUUsTUFBTSxDQUFDLGNBQWM7UUFDMUMsb0JBQUMsU0FBUyxJQUNOLEtBQUssRUFBQyxtQ0FBbUMsRUFDekMsVUFBVSxFQUFDLDZEQUE2RDtZQUMxRSxvQkFBQyxVQUFVLElBQ1QsSUFBSSxFQUFDLFVBQVUsRUFDZixLQUFLLEVBQUUsS0FBSyxFQUNaLFFBQVEsRUFBRSxDQUFDLEtBQW1DLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBRSxLQUFLLENBQUMsTUFBMkIsQ0FBQyxLQUFLLENBQUMsRUFDckcsUUFBUSxFQUFDLEtBQUssRUFDZCxZQUFZLEVBQ1YsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUU7b0JBQ25CLENBQUMsQ0FBQyxTQUFTO29CQUNYLENBQUMsQ0FBQyxvQkFBQyxNQUFNLElBQ0gsT0FBTyxFQUFFLElBQUksRUFDYixPQUFPLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxNQUFNLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFDM0MsSUFBSSxFQUFDLE1BQU0sRUFDWCxNQUFNLEVBQUMsU0FBUyxjQUVYLEdBQ2IsQ0FDUSxDQUNSLENBQUM7QUFDVCxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcblxuaW1wb3J0IHsgQnV0dG9uLCBJY29uTmFtZSwgVG9vbHRpcCwgRm9ybUdyb3VwLCBJbnB1dEdyb3VwLCBJbnRlbnQsIFRleHQsIFBvcG92ZXIsIFBvc2l0aW9uIH0gZnJvbSAnQGJsdWVwcmludGpzL2NvcmUnO1xuXG5pbXBvcnQgeyBvcGVuV2luZG93IH0gZnJvbSAnLi4vLi4vLi4vYXBpX2xlZ2FjeS9yZW5kZXJlcic7XG5pbXBvcnQgeyBjYWxsSVBDLCB1c2VJUENWYWx1ZSB9IGZyb20gJy4uLy4uLy4uL2lwYy9yZW5kZXJlcic7XG5cbmltcG9ydCB7IERhdGFiYXNlU3RhdHVzQ29tcG9uZW50UHJvcHMgfSBmcm9tICcuLi8uLi8uLi9jb25maWcvcmVuZGVyZXInO1xuaW1wb3J0IHsgQmFja2VuZERlc2NyaXB0aW9uLCBCYWNrZW5kU3RhdHVzIH0gZnJvbSAnLi4vYmFzZSc7XG5cbmltcG9ydCBzdHlsZXMgZnJvbSAnLi9zdGF0dXMuc2Nzcyc7XG5cblxuY29uc3QgQmFja2VuZERldGFpbHM6IFJlYWN0LkZDPERhdGFiYXNlU3RhdHVzQ29tcG9uZW50UHJvcHM8QmFja2VuZERlc2NyaXB0aW9uLCBCYWNrZW5kU3RhdHVzPj4gPVxuZnVuY3Rpb24gKHsgZGJJUENQcmVmaXgsIHN0YXR1cywgZGVzY3JpcHRpb24gfSkge1xuICBjb25zdCBpcGNQcmVmaXggPSBkYklQQ1ByZWZpeDtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIG9wZW5QYXNzd29yZFByb21wdChzdGF0dXMubmVlZHNQYXNzd29yZCk7XG4gIH0sIFtzdGF0dXMubmVlZHNQYXNzd29yZF0pO1xuXG4gIGNvbnN0IFtwYXNzd29yZFByb21wdElzT3Blbiwgb3BlblBhc3N3b3JkUHJvbXB0XSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICBhc3luYyBmdW5jdGlvbiBzZXRQYXNzd29yZChwYXNzd29yZDogc3RyaW5nKSB7XG4gICAgYXdhaXQgY2FsbElQQzx7IHBhc3N3b3JkOiBzdHJpbmcgfSwgeyBzdWNjZXNzOiB0cnVlIH0+KGAke2lwY1ByZWZpeH0tZ2l0LXNldC1wYXNzd29yZGAsIHsgcGFzc3dvcmQgfSk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuYmFzZX0+XG4gICAgICA8QnV0dG9uXG4gICAgICAgICAgbWluaW1hbD17dHJ1ZX1cbiAgICAgICAgICBzbWFsbD17dHJ1ZX1cbiAgICAgICAgICBjbGFzc05hbWU9e3N0eWxlcy5zb3VyY2VJbmZvfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGNhbGxJUEMoJ29wZW4tYXJiaXRyYXJ5LXdpbmRvdycsIHtcbiAgICAgICAgICAgIHVybDogZGVzY3JpcHRpb24uZ2l0UmVwbyxcbiAgICAgICAgICAgIHRpdGxlOiBcIkdpdCByZXBvc2l0b3J5XCJcbiAgICAgICAgICB9KX0+XG4gICAgICAgIHtkZXNjcmlwdGlvbi5naXRVc2VybmFtZX1Ae2Rlc2NyaXB0aW9uLmdpdFJlcG99XG4gICAgICA8L0J1dHRvbj5cblxuICAgICAgPFBvcG92ZXIgbWluaW1hbD17dHJ1ZX0gY29udGVudD17XG4gICAgICAgICAgPFBhc3N3b3JkUHJvbXB0XG4gICAgICAgICAgICBvbkNvbmZpcm09e2FzeW5jIChwYXNzd29yZCkgPT4geyBhd2FpdCBzZXRQYXNzd29yZChwYXNzd29yZCk7IG9wZW5QYXNzd29yZFByb21wdChmYWxzZSk7IH19IC8+fVxuICAgICAgICAgICAgcG9zaXRpb249e1Bvc2l0aW9uLlRPUF9SSUdIVH1cbiAgICAgICAgICAgIGlzT3Blbj17cGFzc3dvcmRQcm9tcHRJc09wZW59PlxuICAgICAgICA8QWN0aW9uYWJsZVN0YXR1c1xuICAgICAgICAgIHN0YXR1cz17c3RhdHVzfVxuICAgICAgICAgIHVuY29tbWl0dGVkRmlsZUNvdW50PXtcbiAgICAgICAgICAgIHVzZUlQQ1ZhbHVlKGAke2lwY1ByZWZpeH0tY291bnQtdW5jb21taXR0ZWRgLCB7IG51bVVuY29tbWl0dGVkOiAwIH0pLlxuICAgICAgICAgICAgdmFsdWUubnVtVW5jb21taXR0ZWR9XG4gICAgICAgICAgb25SZXF1ZXN0U3luYz17YXN5bmMgKCkgPT4gYXdhaXQgY2FsbElQQyhgJHtpcGNQcmVmaXh9LWdpdC10cmlnZ2VyLXN5bmNgKX1cbiAgICAgICAgICBvbkRpc2NhcmRVbnN0YWdlZD17YXN5bmMgKCkgPT4gYXdhaXQgY2FsbElQQyhgJHtpcGNQcmVmaXh9LWdpdC1kaXNjYXJkLXVuc3RhZ2VkYCl9XG4gICAgICAgICAgb25Ub2dnbGVQYXNzd29yZFByb21wdD17KCkgPT4gb3BlblBhc3N3b3JkUHJvbXB0KCFwYXNzd29yZFByb21wdElzT3Blbil9XG4gICAgICAgICAgb25TaG93Q29tbWl0V2luZG93PXsoKSA9PiBvcGVuV2luZG93KCdiYXRjaC1jb21taXQnKX1cbiAgICAgICAgICBvblNob3dTZXR0aW5nc1dpbmRvdz17KCkgPT4gb3BlbldpbmRvdygnc2V0dGluZ3MnKX1cbiAgICAgICAgLz5cbiAgICAgIDwvUG9wb3Zlcj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEJhY2tlbmREZXRhaWxzO1xuXG5cbmludGVyZmFjZSBBY3Rpb25hYmxlU3RhdHVzUHJvcHMge1xuICBzdGF0dXM6IEJhY2tlbmRTdGF0dXNcbiAgdW5jb21taXR0ZWRGaWxlQ291bnQ6IG51bWJlclxuICBvblJlcXVlc3RTeW5jOiAoKSA9PiBQcm9taXNlPHZvaWQ+XG4gIG9uRGlzY2FyZFVuc3RhZ2VkOiAoKSA9PiBQcm9taXNlPHZvaWQ+XG4gIG9uVG9nZ2xlUGFzc3dvcmRQcm9tcHQ6ICgpID0+IHZvaWRcbiAgb25TaG93Q29tbWl0V2luZG93OiAoKSA9PiB2b2lkXG4gIG9uU2hvd1NldHRpbmdzV2luZG93OiAoKSA9PiB2b2lkXG59XG5jb25zdCBBY3Rpb25hYmxlU3RhdHVzOiBSZWFjdC5GQzxBY3Rpb25hYmxlU3RhdHVzUHJvcHM+ID0gZnVuY3Rpb24gKHtcbiAgICBzdGF0dXMsIHVuY29tbWl0dGVkRmlsZUNvdW50LFxuICAgIG9uUmVxdWVzdFN5bmMsIG9uRGlzY2FyZFVuc3RhZ2VkLFxuICAgIG9uVG9nZ2xlUGFzc3dvcmRQcm9tcHQsXG4gICAgb25TaG93Q29tbWl0V2luZG93LCBvblNob3dTZXR0aW5nc1dpbmRvdyB9KSB7XG5cbiAgbGV0IHN0YXR1c0ljb246IEljb25OYW1lO1xuICBsZXQgdG9vbHRpcFRleHQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgbGV0IHN0YXR1c0ludGVudDogSW50ZW50O1xuICBsZXQgYWN0aW9uOiBudWxsIHwgKCgpID0+IHZvaWQpO1xuXG4gIGlmIChzdGF0dXMuaXNNaXNjb25maWd1cmVkKSB7XG4gICAgc3RhdHVzSWNvbiA9IFwiZXJyb3JcIjtcbiAgICB0b29sdGlwVGV4dCA9IFwiQ29uZmlndXJhdGlvbiByZXF1aXJlZDsgY2xpY2sgdG8gcmVzb2x2ZVwiO1xuICAgIHN0YXR1c0ludGVudCA9IFwiZGFuZ2VyXCI7XG4gICAgYWN0aW9uID0gb25TaG93U2V0dGluZ3NXaW5kb3c7XG5cbiAgfSBlbHNlIGlmIChzdGF0dXMuaXNPbmxpbmUgIT09IHRydWUpIHtcbiAgICBzdGF0dXNJY29uID0gXCJvZmZsaW5lXCI7XG4gICAgdG9vbHRpcFRleHQgPSBcIk9mZmxpbmVcIlxuICAgIHN0YXR1c0ludGVudCA9IFwiZGFuZ2VyXCI7XG4gICAgYWN0aW9uID0gb25SZXF1ZXN0U3luYztcblxuICB9IGVsc2UgaWYgKHN0YXR1cy5uZWVkc1Bhc3N3b3JkKSB7XG4gICAgc3RhdHVzSWNvbiA9IFwibG9ja1wiO1xuICAgIHRvb2x0aXBUZXh0ID0gXCJQYXNzd29yZCByZXF1aXJlZFwiO1xuICAgIHN0YXR1c0ludGVudCA9IFwicHJpbWFyeVwiO1xuICAgIGFjdGlvbiA9IG9uVG9nZ2xlUGFzc3dvcmRQcm9tcHQ7XG5cbiAgfSBlbHNlIGlmIChzdGF0dXMuaGFzTG9jYWxDaGFuZ2VzKSB7XG4gICAgc3RhdHVzSWNvbiA9IFwiZ2l0LWNvbW1pdFwiO1xuICAgIHRvb2x0aXBUZXh0ID0gXCJVbmNvbW1pdHRlZCBjaGFuZ2VzOyBjbGljayB0byByZXNvbHZlXCI7XG4gICAgc3RhdHVzSW50ZW50ID0gXCJ3YXJuaW5nXCI7XG4gICAgYWN0aW9uID0gYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKHN0YXR1cy5oYXNMb2NhbENoYW5nZXMgJiYgdW5jb21taXR0ZWRGaWxlQ291bnQgPCAxKSB7XG4gICAgICAgIC8vIE5PVEU6IElmIGhhc0xvY2FsQ2hhbmdlcyBzYXlzIHllcywgYnV0IHVuY29tbWl0dGVkIGZpbGUgY291bnQgc2F5cyBubywgdHJ5IHRvIGZpeCBpdC5cbiAgICAgICAgYXdhaXQgb25EaXNjYXJkVW5zdGFnZWQoKTtcbiAgICAgICAgYXdhaXQgb25SZXF1ZXN0U3luYygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb25TaG93Q29tbWl0V2luZG93KCk7XG4gICAgICB9XG4gICAgfVxuXG4gIH0gZWxzZSBpZiAoc3RhdHVzLmlzUHVsbGluZykge1xuICAgIHN0YXR1c0ljb24gPSBcImNsb3VkLWRvd25sb2FkXCJcbiAgICB0b29sdGlwVGV4dCA9IFwiU3luY2hyb25pemluZ1wiO1xuICAgIHN0YXR1c0ludGVudCA9IFwicHJpbWFyeVwiO1xuICAgIGFjdGlvbiA9IG51bGw7XG5cbiAgfSBlbHNlIGlmIChzdGF0dXMuaXNQdXNoaW5nKSB7XG4gICAgc3RhdHVzSWNvbiA9IFwiY2xvdWQtdXBsb2FkXCJcbiAgICB0b29sdGlwVGV4dCA9IFwiU3luY2hyb25pemluZ1wiO1xuICAgIHN0YXR1c0ludGVudCA9IFwicHJpbWFyeVwiO1xuICAgIGFjdGlvbiA9IG51bGw7XG5cbiAgfSBlbHNlIGlmIChzdGF0dXMuc3RhdHVzUmVsYXRpdmVUb0xvY2FsID09PSAnZGl2ZXJnZWQnKSB7XG4gICAgc3RhdHVzSWNvbiA9IFwiZ2l0LWJyYW5jaFwiXG4gICAgdG9vbHRpcFRleHQgPSBcIkRpdmVyZ2luZyBjaGFuZ2VzIHByZXNlbnQ7IGNsaWNrIHRvIHJldHJ5XCI7XG4gICAgc3RhdHVzSW50ZW50ID0gXCJkYW5nZXJcIjtcbiAgICBhY3Rpb24gPSBvblJlcXVlc3RTeW5jO1xuXG4gIH0gZWxzZSBpZiAoc3RhdHVzLnN0YXR1c1JlbGF0aXZlVG9Mb2NhbCA9PT0gJ2JlaGluZCcpIHtcbiAgICBzdGF0dXNJY29uID0gXCJjbG91ZC11cGxvYWRcIlxuICAgIHRvb2x0aXBUZXh0ID0gXCJPbmxpbmVcIjtcbiAgICBzdGF0dXNJbnRlbnQgPSBcIndhcm5pbmdcIjtcbiAgICBhY3Rpb24gPSBvblJlcXVlc3RTeW5jO1xuXG4gIH0gZWxzZSB7XG4gICAgc3RhdHVzSWNvbiA9IFwidXBkYXRlZFwiXG4gICAgdG9vbHRpcFRleHQgPSBcIk9ubGluZVwiO1xuICAgIHN0YXR1c0ludGVudCA9IFwic3VjY2Vzc1wiO1xuICAgIGFjdGlvbiA9IG9uUmVxdWVzdFN5bmM7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxCdXR0b25cbiAgICAgICAgY2xhc3NOYW1lPXtzdHlsZXMuYmFja2VuZFN0YXR1c31cbiAgICAgICAgb25DbGljaz17YWN0aW9uIHx8ICgoKSA9PiB7fSl9XG4gICAgICAgIHNtYWxsPXt0cnVlfVxuICAgICAgICBtaW5pbWFsPXt0cnVlfVxuICAgICAgICBpY29uPXtzdGF0dXNJY29ufVxuICAgICAgICBpbnRlbnQ9e3N0YXR1c0ludGVudH1cbiAgICAgICAgZGlzYWJsZWQ9e2FjdGlvbiA9PT0gbnVsbH1cbiAgICAgICAgbG9hZGluZz17YWN0aW9uID09PSBudWxsfT5cbiAgICAgIHt0b29sdGlwVGV4dH1cbiAgICA8L0J1dHRvbj5cbiAgKTtcbn07XG5cblxuY29uc3QgUGFzc3dvcmRQcm9tcHQ6IFJlYWN0LkZDPHsgb25Db25maXJtOiAodmFsdWU6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPiB9PiA9IGZ1bmN0aW9uICh7IG9uQ29uZmlybSB9KSB7XG4gIGNvbnN0IFt2YWx1ZSwgc2V0VmFsdWVdID0gdXNlU3RhdGUoJycpO1xuXG4gIHJldHVybiA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnBhc3N3b3JkUHJvbXB0fT5cbiAgICA8Rm9ybUdyb3VwXG4gICAgICAgIGxhYmVsPVwiUGxlYXNlIGVudGVyIHJlcG9zaXRvcnkgcGFzc3dvcmQ6XCJcbiAgICAgICAgaGVscGVyVGV4dD1cIlRoZSBwYXNzd29yZCB3aWxsIGJlIGtlcHQgaW4gbWVtb3J5IGFuZCBub3Qgc3RvcmVkIHRvIGRpc2suXCI+XG4gICAgICA8SW5wdXRHcm91cFxuICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICB2YWx1ZT17dmFsdWV9XG4gICAgICAgIG9uQ2hhbmdlPXsoZXZlbnQ6IFJlYWN0LkZvcm1FdmVudDxIVE1MRWxlbWVudD4pID0+IHNldFZhbHVlKChldmVudC50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUpfVxuICAgICAgICBsZWZ0SWNvbj1cImtleVwiXG4gICAgICAgIHJpZ2h0RWxlbWVudD17XG4gICAgICAgICAgdmFsdWUudHJpbSgpID09PSAnJ1xuICAgICAgICAgID8gdW5kZWZpbmVkXG4gICAgICAgICAgOiA8QnV0dG9uXG4gICAgICAgICAgICAgICAgbWluaW1hbD17dHJ1ZX1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXthc3luYyAoKSA9PiBhd2FpdCBvbkNvbmZpcm0odmFsdWUpfVxuICAgICAgICAgICAgICAgIGljb249XCJ0aWNrXCJcbiAgICAgICAgICAgICAgICBpbnRlbnQ9XCJwcmltYXJ5XCI+XG4gICAgICAgICAgICAgIENvbmZpcm1cbiAgICAgICAgICAgIDwvQnV0dG9uPn1cbiAgICAgIC8+XG4gICAgPC9Gb3JtR3JvdXA+XG4gIDwvZGl2Pjtcbn07XG4iXX0=