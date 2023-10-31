import { PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef } from 'react';
import { useDelayed, useWindow } from '@ainias42/react-bootstrap-mobile';

export type Position = { x: number; y: number };

export function useOnMouseDrag<ReturnValue = void>({
    onMouseDown,
    onMouseUp,
    onMouseMove,
}: {
    onMouseDown?: (startPosition: Position, event: ReactPointerEvent) => ReturnValue;
    onMouseMove?: (mouseDiff: Position, currentPosition: Position, event: PointerEvent) => void;
    onMouseUp?: (mouseDiff: Position, endPosition: Position, event: PointerEvent) => void;
}) {
    const mouseDownPos = useRef<undefined | { x: number; y: number }>(undefined);
    const window = useWindow();

    const onMoveStart = useCallback(
        (e: ReactPointerEvent) => {
            mouseDownPos.current = { x: e.clientX, y: e.clientY };
            return onMouseDown?.(mouseDownPos.current, e);
        },
        [onMouseDown]
    );

    const onMove = useDelayed(
        (e: PointerEvent) => {
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
        (e: PointerEvent) => {
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
        window?.addEventListener('pointermove', onMove);
        return () => window?.removeEventListener('pointermove', onMove);
    }, [onMove, window]);

    useEffect(() => {
        window?.addEventListener('pointerup', onMoveStop);
        return () => window?.removeEventListener('pointerup', onMoveStop);
    }, [onMoveStop, window]);

    return onMoveStart;
}
