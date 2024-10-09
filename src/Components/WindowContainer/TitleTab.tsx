import React, { useCallback, useRef } from 'react';
import {
    Clickable, Icon,
    InlineBlock,
    RbmComponentProps,
    Text,
    useDelayed,
    useWindow,
    withMemo,
    WithStringProps,
} from '@ainias42/react-bootstrap-mobile';
import classNames from 'classnames';
import styles from './windowContainer.scss';
import { Position, useOnMouseDrag } from '../hooks/useOnMouseDrag';
import { getWindowStore } from '../store/createWindowStore';
import { ContainerState } from '../types/ContainerState';
import {faClose} from "@fortawesome/free-solid-svg-icons";
import { useShallow } from "zustand/react/shallow";

export type TitleTabProps = RbmComponentProps<
    {
        id: string;
        isActive: boolean;
        onClick: (id: string) => void;
        isHidden?: boolean;
        storeId: string;
        disableDrag: boolean
    },
    WithStringProps
>;

export const TitleTab = withMemo(
    function TitleTab({ id, children, isActive, onClick, className, style, isHidden = false, storeId, disableDrag }: TitleTabProps) {
        // Variables

        // Refs
        const useStore = getWindowStore(storeId);
        const dimension = useStore((s) => s.containers[s.windowContainerMapping[id]]?.dimension);
        const canDrag = useStore((s) => s.containers[s.windowContainerMapping[id]]?.state !== ContainerState.POPUP);
        const onClose = useStore(s => s.windows[id]?.onClose);
        const singleTabContainerId = useStore((s) => {
            if (s.containers[s.windowContainerMapping[id]]?.windowIds.length === 1) {
                return s.windowContainerMapping[id];
            }
            return undefined;
        });
        const [updateDragging, setContainerIsMoving, clearDragging] = useStore(
            useShallow(
            (s) => [s.updateDragging, s.setContainerIsMoving, s.clearDraggingWindow],
            )
        );
        const window = useWindow();

        const dragStartPosition = useRef<Position | undefined>(undefined);
        const ignoredContainerId = useRef<string | undefined>(undefined);

        // States

        // Selectors

        // Callbacks

        const onDrag = useDelayed(
            (e: MouseEvent) => {
                if (!dimension || !dragStartPosition.current) {
                    return;
                }
                const position = { x: e.clientX, y: e.clientY };

                const diff = {
                    x: position.x - dragStartPosition.current.x,
                    y: position.y - dragStartPosition.current.y,
                };

                const newDimension = { ...dimension };

                diff.y = Math.min(Math.max(diff.y, -dimension.top), dimension.bottom);
                diff.x = Math.min(Math.max(diff.x, -dimension.left), dimension.right);

                newDimension.top += diff.y;
                newDimension.left += diff.x;
                newDimension.bottom -= diff.y;
                newDimension.right -= diff.x;

                ignoredContainerId.current = updateDragging(id, position, newDimension, ignoredContainerId.current);
            },
            [dimension, id, updateDragging],
            16,
            16
        );

        const onDragStop = useCallback(() => {
            if (ignoredContainerId.current) {
                setContainerIsMoving(ignoredContainerId.current, false);
            }

            dragStartPosition.current = undefined;
            ignoredContainerId.current = undefined;
            window?.removeEventListener('pointermove', onDrag);
            window?.removeEventListener('pointerup', onDragStop);
            window?.document.body.classList.remove(styles.noSelect);
            clearDragging();
        }, [clearDragging, onDrag, setContainerIsMoving, window]);

        const onDragStart = useCallback(
            (e: MouseEvent, startPosition: Position) => {
                if (disableDrag) {
                    return;
                }


                dragStartPosition.current = startPosition;
                ignoredContainerId.current = singleTabContainerId;
                onDrag(e);
                window?.addEventListener('pointermove', onDrag);
                window?.addEventListener('pointerup', onDragStop);
                window?.document.body.classList.add(styles.noSelect);
            },
            [disableDrag, onDrag, onDragStop, singleTabContainerId, window]
        );

        const onClickInner = useCallback(() => {
            onClick(id);
        }, [id, onClick]);

        const onMouseMove = useCallback(
            (diff: Position, currentPosition: Position, event: PointerEvent) => {
                if (!canDrag || dragStartPosition.current || (Math.abs(diff.x) < 5 && Math.abs(diff.y) < 5)) {
                    return;
                }
                onDragStart(event, { x: currentPosition.x - diff.x, y: currentPosition.y - diff.y });
            },
            [canDrag, onDragStart]
        );

        // Effects
        const onMouseDown = useOnMouseDrag({ onMouseMove });

        // Other

        // Render Functions

        return (
            <InlineBlock
                className={classNames(
                    styles.titleTab,
                    {
                        [styles.titleTabActive]: isActive,
                        [styles.titleTabHidden]: isHidden,
                        [styles.closeable]: !!onClose,
                    },
                    className
                )}
                style={style}
            >
                <Clickable onClick={onClickInner} onPointerDown={onMouseDown} preventDefault={false}>
                        <Text className={styles.titleText}>{children}</Text>
                        <Clickable onClick={onClose} className={styles.closeButton}><Icon icon={faClose}/></Clickable>
                </Clickable>
            </InlineBlock>
        );
    },
    styles,
    'text'
);
