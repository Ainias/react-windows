import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { InlineBlock, RbmComponentProps, useComposedRef, withMemo } from 'react-bootstrap-mobile';
import { TitleTab } from './TitleTab';
import { selectTitleInfos } from '../store/selectTitleInfos';
import { getWindowStore } from '../store/createWindowStore';
import { selectActiveWindowIdForContainer } from '../store/selectAvticeWindowIdForContainer';
import styles from './windowContainer.scss';
import classNames from 'classnames';
import { DropTargetMonitor, useDrop } from 'react-dnd';
import { getDragType } from '../helper/getDragType';

export type TitleTabBarProps = RbmComponentProps<{ storeId: string; containerId: string }>;

const TAB_MAX_WIDTH = 150;
export const TitleTabBar = withMemo(function TitleTabBar({ storeId, containerId, style, className }: TitleTabBarProps) {
    // Variables

    // States
    const useStore = getWindowStore(storeId);
    const titleInfos = useStore((s) => selectTitleInfos(s, containerId));
    const activeWindowId = useStore((s) => selectActiveWindowIdForContainer(s, containerId));
    const updateContainerActiveWindow = useStore((s) => s.updateContainerActiveWindow);
    const setIsDraggingOver = useStore((s) => s.setIsDraggingOver);
    const removeIsDraggingOver = useStore((s) => s.removeIsDraggingOver);
    const moveWindow = useStore((s) => s.moveWindow);

    const [previewTab, setPreviewTab] = useState<undefined | { id: string; title: string; index: number }>(undefined);

    const [{ isOver, dragItemId }, dropRef] = useDrop(() => {
        const getDropIndex = (monitor: DropTargetMonitor) => {
            const elem = tabBarRef.current;
            const mouseX = monitor.getClientOffset()?.x;
            if (!elem || !mouseX) {
                return undefined;
            }
            const { left, right } = elem.getBoundingClientRect();
            const width = right - left;
            const diff = mouseX - left;
            const paddingRight = parseInt(getComputedStyle(elem).paddingRight, 10);
            const widthPerTab = Math.min((width - paddingRight) / (titleInfos.length + 1), TAB_MAX_WIDTH);
            return Math.floor(diff / widthPerTab);
        };

        return {
            accept: getDragType(storeId),
            collect: (monitor) => ({
                isOver: monitor.isOver(),
                dragItemId:
                    monitor.getItemType() === getDragType(storeId) ? monitor.getItem<{ id: string }>()?.id : undefined,
            }),
            hover: (item: { id: string; title: string }, monitor) => {
                const index = getDropIndex(monitor);
                if (index === undefined) {
                    setPreviewTab(undefined);
                    return;
                }
                setPreviewTab((old) => {
                    if (old?.index !== index) {
                        return { ...item, index };
                    }
                    return old;
                });
            },
            drop: (item: { id: string; title: string }, monitor) => {
                setPreviewTab(undefined);
                const index = getDropIndex(monitor);
                if (index === undefined) {
                    return;
                }
                moveWindow(containerId, item.id, index);
            },
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerId, moveWindow, storeId, titleInfos.length]);

    const containerIsDragSource = useStore((s) => !!dragItemId && s.windowContainerMapping[dragItemId] === containerId);

    const tabs = useMemo(() => {
        if (previewTab) {
            let added = false;
            const newTabs: { id: string; title: string }[] = [];
            titleInfos.forEach((info, index) => {
                if (index === previewTab.index) {
                    newTabs.push(previewTab);
                    added = true;
                }
                if (dragItemId !== info.id) {
                    newTabs.push(info);
                }
            });
            if (!added) {
                newTabs.push(previewTab);
            }
            return newTabs;
        }
        return titleInfos;
    }, [dragItemId, previewTab, titleInfos]);

    // Refs
    const tabBarRef = useComposedRef<HTMLElement>(dropRef);

    // Selectors

    // Callbacks
    const setActiveWindow = useCallback(
        (activeWindow: string) => updateContainerActiveWindow(containerId, activeWindow),
        [containerId, updateContainerActiveWindow]
    );

    // Effects
    useLayoutEffect(() => {
        if (!isOver) {
            setPreviewTab(undefined);
            removeIsDraggingOver(containerId);
        } else {
            setIsDraggingOver(containerId);
        }
    }, [containerId, isOver, removeIsDraggingOver, setIsDraggingOver]);

    // Other

    // Render Functions

    // prevent division by zero
    // const tabLength = Math.max(tabs.length - (containerIsDragSource && !isOver ? 1 : 0), 1);
    const tabLength = tabs.length;
    return (
        <InlineBlock
            style={style}
            className={classNames(className, styles.titleTabBar, { [styles.singleTab]: tabLength === 1 })}
            ref={tabBarRef}
        >
            {tabs.map((info) => (
                <TitleTab
                    key={info.id}
                    id={info.id}
                    isActive={info.id === activeWindowId}
                    onClick={setActiveWindow}
                    storeId={storeId}
                    style={{ width: `${Math.floor(100 / tabLength)}%` }}
                    isHidden={containerIsDragSource && dragItemId === info.id && !isOver}
                >
                    {info.title}
                </TitleTab>
            ))}
        </InlineBlock>
    );
}, styles);
