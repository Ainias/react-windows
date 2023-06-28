import { WindowStoreState } from './createWindowStore';
export declare function selectActiveWindowIdForContainer({ containers, windows }: WindowStoreState, containerId: string): string | undefined;
