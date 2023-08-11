import type { WindowContainerData } from '../store/createWindowStore';
import { Position } from '../hooks/useOnMouseDrag';
export declare function checkOverContainerAndTabPosition(containers: WindowContainerData[], position: Position, windows: Record<string, any>, excludedContainerId?: string): {
    container: string;
    index: number;
} | undefined;
