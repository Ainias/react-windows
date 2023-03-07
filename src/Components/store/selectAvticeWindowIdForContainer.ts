import { WindowStoreState } from './createWindowStore';

export function selectActiveWindowIdForContainer({ containers, windows }: WindowStoreState, containerId: string) {
    const container = containers[containerId];
    if (!container) {
        return undefined;
    }
    return [container.activeWindowId, ...container.windowIds].find((id) => windows[id]);
}
