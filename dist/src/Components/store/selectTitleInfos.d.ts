import { WindowStoreState } from './createWindowStore';
export declare function selectTitleInfos({ containers, windows }: WindowStoreState, containerId: string): {
    id: string;
    title: string;
}[];
