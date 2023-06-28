import type { WindowContainerData } from '../store/createWindowStore';
export declare function updateDimensions(containers: Record<string, WindowContainerData>, oldWindowDimension: {
    x: number;
    y: number;
}, newWindowDimension: {
    x: number;
    y: number;
}): Record<string, WindowContainerData>;
