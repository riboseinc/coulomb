/* Simple API on top of Electron’s IPC framework, the `main` side.
   Provides functions for handling API requests to fetch/store data and/or open window. */
import * as log from 'electron-log';
import { ipcMain } from 'electron';
import { notifyAllWindows, openWindow } from '../main/window';
import { getEventNamesForWindowEndpoint } from '../api_legacy/utils';
import { reviveJsonValue } from './utils';
export function listen(name, handler) {
    /* Defines an API endpoint with I input and O output types.
       Takes endpoint name and handler function.
  
       Handler is expected to be an async function
       that takes deserialized input params and returns the output.
  
       The endpoint handles input deserialization,
       wrapping the output in response object { errors: string[], result: O },
       and response serialization. */
    ipcMain.handle(name, async (evt, rawInput) => {
        let response;
        // We may be able to switch to Electron’s own (de)serialization behavior
        // if we find a way to plug our bespoke `reviveJsonValue`.
        const input = JSON.parse(rawInput || '{}', reviveJsonValue);
        try {
            response = { errors: [], result: await handler(input) };
        }
        catch (e) {
            log.error(`C/ipc: Error handling request to ${name}! ${e.toString()}: ${e.stack}}`);
            response = { errors: [`${e.message}`], result: undefined };
        }
        //log.silly(`C/ipc: handled request to ${name}`);
        return JSON.stringify(response);
    });
}
export function unlisten(eventName, handler) {
    /* Removes event listener created with listen(). */
    return ipcMain.removeListener(eventName, handler);
}
// See also ipc.renderer.useIPCWindowEventRelayer().
// Used if one window needs to notify other windows.
// NOTE: Generally discouraged, somewhat of a crutch.
listen('relay-event-to-all-windows', async ({ eventName, payload }) => {
    await notifyAllWindows(eventName, payload);
    return { success: true };
});
export function makeWindowEndpoint(name, getWindowOpts) {
    // TODO: Migrate to listen()?
    const eventNames = getEventNamesForWindowEndpoint(name);
    ipcMain.on(eventNames.request, async (evt, params) => {
        const parsedParams = JSON.parse(params || '{}', reviveJsonValue);
        await openWindow(getWindowOpts(parsedParams));
        const result = JSON.stringify({ errors: [] });
        evt.returnValue = result;
        evt.reply(eventNames.response, result);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9pcGMvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTswRkFDMEY7QUFFMUYsT0FBTyxLQUFLLEdBQUcsTUFBTSxjQUFjLENBQUM7QUFFcEMsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUNuQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsVUFBVSxFQUFzQixNQUFNLGdCQUFnQixDQUFDO0FBQ2xGLE9BQU8sRUFBZSw4QkFBOEIsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBRWxGLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFJMUMsTUFBTSxVQUFVLE1BQU0sQ0FDckIsSUFBWSxFQUFFLE9BQXNCO0lBQ25DOzs7Ozs7OztxQ0FRaUM7SUFFakMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQVEsRUFBRSxRQUFpQixFQUFFLEVBQUU7UUFDekQsSUFBSSxRQUF3QixDQUFDO1FBRTdCLHdFQUF3RTtRQUN4RSwwREFBMEQ7UUFDMUQsTUFBTSxLQUFLLEdBQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLElBQUksSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBRS9ELElBQUk7WUFDRixRQUFRLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxNQUFNLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1NBQ3pEO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDVixHQUFHLENBQUMsS0FBSyxDQUFDLG9DQUFvQyxJQUFJLEtBQUssQ0FBQyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ3BGLFFBQVEsR0FBRyxFQUFFLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDO1NBQzVEO1FBRUQsaURBQWlEO1FBRWpELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNsQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFHRCxNQUFNLFVBQVUsUUFBUSxDQUFDLFNBQWlCLEVBQUUsT0FBMEI7SUFDcEUsbURBQW1EO0lBQ25ELE9BQU8sT0FBTyxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDcEQsQ0FBQztBQUdELG9EQUFvRDtBQUNwRCxvREFBb0Q7QUFDcEQscURBQXFEO0FBQ3JELE1BQU0sQ0FDTCw0QkFBNEIsRUFBRSxLQUFLLEVBQUUsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtJQUM5RCxNQUFNLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMzQyxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDO0FBQzNCLENBQUMsQ0FBQyxDQUFDO0FBR0gsTUFBTSxVQUFVLGtCQUFrQixDQUFDLElBQVksRUFBRSxhQUFrRDtJQUNqRyw2QkFBNkI7SUFDN0IsTUFBTSxVQUFVLEdBQUcsOEJBQThCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFeEQsT0FBTyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxHQUFRLEVBQUUsTUFBZSxFQUFFLEVBQUU7UUFDakUsTUFBTSxZQUFZLEdBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sVUFBVSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBRTlDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM5QyxHQUFHLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQztRQUN6QixHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogU2ltcGxlIEFQSSBvbiB0b3Agb2YgRWxlY3Ryb27igJlzIElQQyBmcmFtZXdvcmssIHRoZSBgbWFpbmAgc2lkZS5cbiAgIFByb3ZpZGVzIGZ1bmN0aW9ucyBmb3IgaGFuZGxpbmcgQVBJIHJlcXVlc3RzIHRvIGZldGNoL3N0b3JlIGRhdGEgYW5kL29yIG9wZW4gd2luZG93LiAqL1xuXG5pbXBvcnQgKiBhcyBsb2cgZnJvbSAnZWxlY3Ryb24tbG9nJztcblxuaW1wb3J0IHsgaXBjTWFpbiB9IGZyb20gJ2VsZWN0cm9uJztcbmltcG9ydCB7IG5vdGlmeUFsbFdpbmRvd3MsIG9wZW5XaW5kb3csIFdpbmRvd09wZW5lclBhcmFtcyB9IGZyb20gJy4uL21haW4vd2luZG93JztcbmltcG9ydCB7IEFQSVJlc3BvbnNlLCBnZXRFdmVudE5hbWVzRm9yV2luZG93RW5kcG9pbnQgfSBmcm9tICcuLi9hcGlfbGVnYWN5L3V0aWxzJztcblxuaW1wb3J0IHsgcmV2aXZlSnNvblZhbHVlIH0gZnJvbSAnLi91dGlscyc7XG5cblxuZXhwb3J0IHR5cGUgSGFuZGxlcjxJIGV4dGVuZHMgb2JqZWN0LCBPIGV4dGVuZHMgb2JqZWN0PiA9IChwYXJhbXM6IEkpID0+IFByb21pc2U8Tz47XG5leHBvcnQgZnVuY3Rpb24gbGlzdGVuPEkgZXh0ZW5kcyBvYmplY3QsIE8gZXh0ZW5kcyBvYmplY3Q+XG4obmFtZTogc3RyaW5nLCBoYW5kbGVyOiBIYW5kbGVyPEksIE8+KSB7XG4gIC8qIERlZmluZXMgYW4gQVBJIGVuZHBvaW50IHdpdGggSSBpbnB1dCBhbmQgTyBvdXRwdXQgdHlwZXMuXG4gICAgIFRha2VzIGVuZHBvaW50IG5hbWUgYW5kIGhhbmRsZXIgZnVuY3Rpb24uXG5cbiAgICAgSGFuZGxlciBpcyBleHBlY3RlZCB0byBiZSBhbiBhc3luYyBmdW5jdGlvblxuICAgICB0aGF0IHRha2VzIGRlc2VyaWFsaXplZCBpbnB1dCBwYXJhbXMgYW5kIHJldHVybnMgdGhlIG91dHB1dC5cblxuICAgICBUaGUgZW5kcG9pbnQgaGFuZGxlcyBpbnB1dCBkZXNlcmlhbGl6YXRpb24sXG4gICAgIHdyYXBwaW5nIHRoZSBvdXRwdXQgaW4gcmVzcG9uc2Ugb2JqZWN0IHsgZXJyb3JzOiBzdHJpbmdbXSwgcmVzdWx0OiBPIH0sXG4gICAgIGFuZCByZXNwb25zZSBzZXJpYWxpemF0aW9uLiAqL1xuXG4gIGlwY01haW4uaGFuZGxlKG5hbWUsIGFzeW5jIChldnQ6IGFueSwgcmF3SW5wdXQ/OiBzdHJpbmcpID0+IHtcbiAgICBsZXQgcmVzcG9uc2U6IEFQSVJlc3BvbnNlPE8+O1xuXG4gICAgLy8gV2UgbWF5IGJlIGFibGUgdG8gc3dpdGNoIHRvIEVsZWN0cm9u4oCZcyBvd24gKGRlKXNlcmlhbGl6YXRpb24gYmVoYXZpb3JcbiAgICAvLyBpZiB3ZSBmaW5kIGEgd2F5IHRvIHBsdWcgb3VyIGJlc3Bva2UgYHJldml2ZUpzb25WYWx1ZWAuXG4gICAgY29uc3QgaW5wdXQ6IEkgPSBKU09OLnBhcnNlKHJhd0lucHV0IHx8ICd7fScsIHJldml2ZUpzb25WYWx1ZSk7XG5cbiAgICB0cnkge1xuICAgICAgcmVzcG9uc2UgPSB7IGVycm9yczogW10sIHJlc3VsdDogYXdhaXQgaGFuZGxlcihpbnB1dCkgfTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBsb2cuZXJyb3IoYEMvaXBjOiBFcnJvciBoYW5kbGluZyByZXF1ZXN0IHRvICR7bmFtZX0hICR7ZS50b1N0cmluZygpfTogJHtlLnN0YWNrfX1gKTtcbiAgICAgIHJlc3BvbnNlID0geyBlcnJvcnM6IFtgJHtlLm1lc3NhZ2V9YF0sIHJlc3VsdDogdW5kZWZpbmVkIH07XG4gICAgfVxuXG4gICAgLy9sb2cuc2lsbHkoYEMvaXBjOiBoYW5kbGVkIHJlcXVlc3QgdG8gJHtuYW1lfWApO1xuXG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlKTtcbiAgfSk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHVubGlzdGVuKGV2ZW50TmFtZTogc3RyaW5nLCBoYW5kbGVyOiBIYW5kbGVyPGFueSwgYW55Pikge1xuICAvKiBSZW1vdmVzIGV2ZW50IGxpc3RlbmVyIGNyZWF0ZWQgd2l0aCBsaXN0ZW4oKS4gKi9cbiAgcmV0dXJuIGlwY01haW4ucmVtb3ZlTGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyKTtcbn1cblxuXG4vLyBTZWUgYWxzbyBpcGMucmVuZGVyZXIudXNlSVBDV2luZG93RXZlbnRSZWxheWVyKCkuXG4vLyBVc2VkIGlmIG9uZSB3aW5kb3cgbmVlZHMgdG8gbm90aWZ5IG90aGVyIHdpbmRvd3MuXG4vLyBOT1RFOiBHZW5lcmFsbHkgZGlzY291cmFnZWQsIHNvbWV3aGF0IG9mIGEgY3J1dGNoLlxubGlzdGVuPHsgZXZlbnROYW1lOiBzdHJpbmcsIHBheWxvYWQ/OiBhbnkgfSwgeyBzdWNjZXNzOiB0cnVlIH0+XG4oJ3JlbGF5LWV2ZW50LXRvLWFsbC13aW5kb3dzJywgYXN5bmMgKHsgZXZlbnROYW1lLCBwYXlsb2FkIH0pID0+IHtcbiAgYXdhaXQgbm90aWZ5QWxsV2luZG93cyhldmVudE5hbWUsIHBheWxvYWQpO1xuICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XG59KTtcblxuXG5leHBvcnQgZnVuY3Rpb24gbWFrZVdpbmRvd0VuZHBvaW50KG5hbWU6IHN0cmluZywgZ2V0V2luZG93T3B0czogKHBhcmFtczogYW55KSA9PiBXaW5kb3dPcGVuZXJQYXJhbXMpOiB2b2lkIHtcbiAgLy8gVE9ETzogTWlncmF0ZSB0byBsaXN0ZW4oKT9cbiAgY29uc3QgZXZlbnROYW1lcyA9IGdldEV2ZW50TmFtZXNGb3JXaW5kb3dFbmRwb2ludChuYW1lKTtcblxuICBpcGNNYWluLm9uKGV2ZW50TmFtZXMucmVxdWVzdCwgYXN5bmMgKGV2dDogYW55LCBwYXJhbXM/OiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBwYXJzZWRQYXJhbXM6IGFueSA9IEpTT04ucGFyc2UocGFyYW1zIHx8ICd7fScsIHJldml2ZUpzb25WYWx1ZSk7XG4gICAgYXdhaXQgb3BlbldpbmRvdyhnZXRXaW5kb3dPcHRzKHBhcnNlZFBhcmFtcykpO1xuXG4gICAgY29uc3QgcmVzdWx0ID0gSlNPTi5zdHJpbmdpZnkoeyBlcnJvcnM6IFtdIH0pO1xuICAgIGV2dC5yZXR1cm5WYWx1ZSA9IHJlc3VsdDtcbiAgICBldnQucmVwbHkoZXZlbnROYW1lcy5yZXNwb25zZSwgcmVzdWx0KTtcbiAgfSk7XG59XG4iXX0=