import { WindowData, WindowStoreState } from "./createWindowStore";
import { URecord } from "@ainias42/js-helper";

export function selectWindowsForContainer({containers, windows}: WindowStoreState, containerId: string) {
    const container = containers[containerId];
    if (!container) {
        return undefined;
    }
    const containerWindows : URecord<string, WindowData>= {};
    container.windowIds.forEach((id) => {
        containerWindows[id] = windows[id];
    });
    return containerWindows;
}
