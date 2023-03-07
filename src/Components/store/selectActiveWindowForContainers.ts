import { WindowStoreState } from './createWindowStore';
import { selectActiveWindowIdForContainer } from './selectAvticeWindowIdForContainer';

export function selectActiveWindowForContainer(state: WindowStoreState, containerId: string) {
    const activeWindowId = selectActiveWindowIdForContainer(state, containerId);
    if (activeWindowId) {
        return state.windows[activeWindowId];
    }
    return undefined;
}
