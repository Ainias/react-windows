import {WindowStoreState} from "./createWindowStore";

export function selectCanCloseContainer({containers, windows}:WindowStoreState, containerId: string){
    const container = containers[containerId];
    if (!container) {
        return false;
    }
    return container.windowIds.every((id) => !windows[id] || !!windows[id].onClose);
}
