import React from 'react';
import { withMemo } from '@ainias42/react-bootstrap-mobile';
import { getWindowStore } from '../store/createWindowStore';
import { selectActiveWindowForContainer } from '../store/selectActiveWindowForContainers';
import { WindowContainer } from './WindowContainer';
import { selectTitleInfos } from '../store/selectTitleInfos';

import styles from './windowContainer.scss';

export type WindowContainerFromStoreProps = {
    id: string;
    store?: string;
    initialTop?: number;
    initialLeft?: number;
};

export const WindowContainerFromStore = withMemo(function WindowContainerFromStore({
    id,
    store = 'default',
    initialTop,
    initialLeft,
}: WindowContainerFromStoreProps) {
    // Variables

    // Refs

    // States

    // Selectors

    const useStore = getWindowStore(store);
    const containerData = useStore((s) => s.containers[id]);
    const windowData = useStore((s) => selectActiveWindowForContainer(s, id));
    const isActive = useStore((s) => s.activeContainerId === id);
    const titleInfos = useStore((s) => selectTitleInfos(s, id));

    // Dragging

    // Callbacks

    // Effects

    // Other

    // Render Functions

    return (
        <WindowContainer
            id={id}
            store={store}
            initialTop={initialTop}
            initialLeft={initialLeft}
            containerData={containerData}
            windowData={windowData}
            isActive={isActive}
            titleInfos={titleInfos}
        />
    );
},
styles);
