import { MouseEvent as ReactMouseEvent } from 'react';
export type Position = {
    x: number;
    y: number;
};
export declare function useOnMouseDrag<ReturnValue = void>({ onMouseDown, onMouseUp, onMouseMove, }: {
    onMouseDown?: (startPosition: Position, event: ReactMouseEvent) => ReturnValue;
    onMouseMove?: (mouseDiff: Position, currentPosition: Position, event: MouseEvent) => void;
    onMouseUp?: (mouseDiff: Position, endPosition: Position, event: MouseEvent) => void;
}): (e: ReactMouseEvent) => ReturnValue | undefined;
