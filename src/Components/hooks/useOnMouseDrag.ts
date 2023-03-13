import { MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef } from 'react';
import { useDelayed, useWindow } from '@ainias42/react-bootstrap-mobile';

export type Position = { x: number; y: number };

export function useOnMouseDrag<ReturnValue = void>({
    onMouseDown,
    onMouseUp,
    onMouseMove,
}: {
    onMouseDown?: (startPosition: Position, event: ReactMouseEvent) => ReturnValue;
    onMouseMove?: (mouseDiff: Position, currentPosition: Position, event: MouseEvent) => void;
    onMouseUp?: (mouseDiff: Position, endPosition: Position, event: MouseEvent) => void;
}) {
    const mouseDownPos = useRef<undefined | { x: number; y: number }>(undefined);
    const window = useWindow();

    const onMoveStart = useCallback(
        (e: ReactMouseEvent) => {
            mouseDownPos.current = { x: e.clientX, y: e.clientY };
            return onMouseDown?.(mouseDownPos.current, e);
        },
        [onMouseDown]
    );

    const onMove = useDelayed(
        (e: MouseEvent) => {
            if (!mouseDownPos.current) {
                return;
            }

            const currentPosition = { x: e.clientX, y: e.clientY };
            const diff = {
                x: currentPosition.x - mouseDownPos.current.x,
                y: currentPosition.y - mouseDownPos.current.y,
            };
            onMouseMove?.(diff, currentPosition, e);
        },
        [onMouseMove],
        16,
        16
    );

    const onMoveStop = useCallback(
        (e: MouseEvent) => {
            if (!mouseDownPos.current) {
                return;
            }
            const currentPosition = { x: e.clientX, y: e.clientY };
            const diff = {
                x: currentPosition.x - mouseDownPos.current.x,
                y: currentPosition.y - mouseDownPos.current.y,
            };
            onMouseUp?.(diff, currentPosition, e);

            mouseDownPos.current = undefined;
        },
        [onMouseUp]
    );

    useEffect(() => {
        window?.addEventListener('mousemove', onMove);
        return () => window?.removeEventListener('mousemove', onMove);
    }, [onMove, window]);

    useEffect(() => {
        window?.addEventListener('mouseup', onMoveStop);
        return () => window?.removeEventListener('mouseup', onMoveStop);
    }, [onMoveStop, window]);

    return onMoveStart;
}
