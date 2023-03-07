import { WindowStoreState } from './createWindowStore';

export function selectTitleInfos({ containers, windows }: WindowStoreState, containerId: string) {
    const container = containers[containerId];
    if (!container) {
        return [];
    }
    const titleInfos: { id: string; title: string }[] = [];
    container.windowIds.forEach((id) => {
        const window = windows[id];
        if (!window) {
            return;
        }
        titleInfos.push({ id, title: window.title });
    });
    return titleInfos;
}
