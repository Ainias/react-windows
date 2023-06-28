import React, { useCallback, useRef } from 'react';
import {
    Clickable,
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
import { shallow } from 'zustand/shallow';
import { ContainerState } from '../types/ContainerState';

export type TitleTabProps = RbmComponentProps<
    {
        id: string;
        isActive: boolean;
        onClick: (id: string) => void;
        isHidden?: boolean;
        storeId: string;
    },
    WithStringProps
>;

export const TitleTab = withMemo(
    function TitleTab({ id, children, isActive, onClick, className, style, isHidden = false, storeId }: TitleTabProps) {
        // Variables

        // Refs
        const useStore = getWindowStore(storeId);
        const dimension = useStore((s) => s.containers[s.windowContainerMapping[id]]?.dimension);
        const canDrag = useStore((s) => s.containers[s.windowContainerMapping[id]]?.state !== ContainerState.POPUP);
        const singleTabContainerId = useStore((s) => {
            if (s.containers[s.windowContainerMapping[id]]?.windowIds.length === 1) {
                return s.windowContainerMapping[id];
            }
            return undefined;
        });
        const [updateDragging, setContainerIsMoving] = useStore(
            (s) => [s.updateDragging, s.setContainerIsMoving],
            shallow
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
            window?.removeEventListener('mousemove', onDrag);
            window?.removeEventListener('mouseup', onDragStop);
            window?.document.body.classList.remove(styles.noSelect);
        }, [onDrag, setContainerIsMoving, window]);

        const onDragStart = useCallback(
            (e: MouseEvent, startPosition: Position) => {
                dragStartPosition.current = startPosition;
                ignoredContainerId.current = singleTabContainerId;
                onDrag(e);
                window?.addEventListener('mousemove', onDrag);
                window?.addEventListener('mouseup', onDragStop);
                window?.document.body.classList.add(styles.noSelect);
            },
            [onDrag, onDragStop, singleTabContainerId, window]
        );

        const onClickInner = useCallback(() => {
            onClick(id);
        }, [id, onClick]);

        const onMouseMove = useCallback(
            (diff, currentPosition: Position, event) => {
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
                    },
                    className
                )}
                style={style}
            >
                <Clickable onClick={onClickInner} onMouseDown={onMouseDown} preventDefault={false}>
                    <Text className={styles.titleText}>{children}</Text>
                </Clickable>
            </InlineBlock>
        );
    },
    styles,
    'text'
);
