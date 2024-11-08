import React, { useCallback, useRef } from 'react';
import { Clickable, RbmComponentProps, withMemo } from '@ainias42/react-bootstrap-mobile';
import { TitleTab } from './TitleTab';
import { getWindowStore } from '../store/createWindowStore';
import { selectActiveWindowIdForContainer } from '../store/selectAvticeWindowIdForContainer';
import styles from './windowContainer.scss';
import classNames from 'classnames';
import { WindowContainerDimension } from './WindowContainerDimension';
import { Position, useOnMouseDrag } from '../hooks/useOnMouseDrag';
import { useShallow } from "zustand/react/shallow";

export type TitleTabBarProps = RbmComponentProps<{
    storeId: string;
    containerId: string;
    titleInfos: { id: string; title: string }[];
    onMoveUpdate: (isMoving: boolean) => void;
    isLocked: boolean;
}>;

export const TitleTabBar = withMemo(function TitleTabBar({
    storeId,
    containerId,
    style,
    className,
    titleInfos,
    onMoveUpdate,
    isLocked
}: TitleTabBarProps) {
    // Variables

    // States
    const useStore = getWindowStore(storeId);
    const activeWindowId = useStore((s) => selectActiveWindowIdForContainer(s, containerId));
    const dimension = useStore((s) => s.containers[containerId]?.dimension);
    const [updateContainerActiveWindow, setActiveContainer, updateContainerDimension] = useStore(
        useShallow(
        (s) => [s.updateContainerActiveWindow, s.setActiveContainer, s.updateContainerDimension],
        )
    );
    const moveStartDimension = useRef<WindowContainerDimension|undefined>(undefined);

    // Refs

    // Selectors

    // Callbacks
    const setActive = useCallback(() => setActiveContainer(containerId), [containerId, setActiveContainer]);
    const setDimension = useCallback(
        (newDimension: WindowContainerDimension | undefined) => updateContainerDimension(containerId, newDimension, false),
        [containerId, updateContainerDimension]
    );

    const onMouseDown = useCallback(() => {
        if (isLocked) {
            return;
        }

        moveStartDimension.current = dimension;
        onMoveUpdate(true);
        setActive();
    }, [dimension, isLocked, onMoveUpdate, setActive]);

    const onMouseMove = useCallback(
        (diff: Position) => {
            const startDimension = moveStartDimension.current;
            if (!startDimension) {
                return;
            }

            const newDimension = { ...startDimension };

            diff.y = Math.min(Math.max(diff.y, -startDimension.top), startDimension.bottom);
            diff.x = Math.min(Math.max(diff.x, -startDimension.left), startDimension.right);

            newDimension.top += diff.y;
            newDimension.left += diff.x;
            newDimension.bottom -= diff.y;
            newDimension.right -= diff.x;

            setDimension(newDimension);
        },
        [setDimension]
    );

    const onMouseUp = useCallback(() => {
        moveStartDimension.current = undefined;
        onMoveUpdate(false);
    }, [onMoveUpdate]);

    const setActiveWindow = useCallback(
        (activeWindow: string) => updateContainerActiveWindow(containerId, activeWindow),
        [containerId, updateContainerActiveWindow]
    );

    const onMoveStart = useOnMouseDrag({ onMouseDown, onMouseMove, onMouseUp });

    // Effects

    // Other

    // Render Functions

    // prevent division by zero
    const tabLength = titleInfos.length;
    return (
        <Clickable
            onPointerDown={onMoveStart}
            style={style}
            className={classNames(className, styles.titleTabBar, { [styles.singleTab]: tabLength === 1 })}
        >
            {titleInfos.map((info) => (
                <TitleTab
                    key={info.id}
                    id={info.id}
                    isActive={info.id === activeWindowId}
                    onClick={setActiveWindow}
                    style={{ width: `${Math.floor(100 / tabLength)}%` }}
                    isHidden={false}
                    storeId={storeId}
                    disableDrag={isLocked && titleInfos.length === 1}
                >
                    {info.title}
                </TitleTab>
            ))}
        </Clickable>
    );
},
styles);
