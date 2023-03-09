import React from 'react';
import { withMemo } from 'react-bootstrap-mobile';
import { useDragLayer } from 'react-dnd';
import { getDragType } from '../helper/getDragType';
import { getWindowStore } from '../store/createWindowStore';
import styles from './windowDragPreview.scss';
import { WindowContainer } from '../WindowContainer/WindowContainer';
import { checkWindowDimension } from '../WindowContainer/checkWindowDimension';

export type WindowDragPreviewProps = { storeId: string };

export const WindowDragPreview = withMemo(function WindowDragPreview({ storeId }: WindowDragPreviewProps) {
    // Variables
    const { isDragging, item, diff, initialOffset } = useDragLayer((monitor) => {
        return {
            item: monitor.getItem(),
            diff: monitor.getDifferenceFromInitialOffset(),
            isDragging: monitor.getItemType() === getDragType(storeId),
            initialOffset: monitor.getInitialSourceClientOffset(),
        };
    });

    const useStore = getWindowStore(storeId);
    const container = useStore((s) => s.containers[s.windowContainerMapping[item?.id]]);
    const isDraggingOver = useStore((s) => !!s.isDraggingOver);
    const windowData = useStore((s) => s.windows[item?.id]);
    const dimension = container?.dimension;

    // Refs

    // States

    // Selectors

    // Callbacks

    // Effects

    // Other
    if (!isDragging || isDraggingOver || !dimension || !diff || !initialOffset || !windowData || !container) {
        return null;
    }

    const offsetDiff = {
        x: initialOffset.x - dimension.left,
        y: initialOffset.y - dimension.top,
    };

    const previewDimension = {
        left: dimension.left + diff.x + offsetDiff.x,
        right: dimension.right - diff.x - offsetDiff.x,
        top: dimension.top + diff.y + offsetDiff.y,
        bottom: dimension.bottom - diff.y - offsetDiff.y,
    };

    checkWindowDimension(previewDimension);

    // Render Functions
    return (
        <WindowContainer
            id={container.id}
            isActive={true}
            containerData={{ ...container, dimension: previewDimension }}
            windowData={windowData}
            store={storeId}
            disabled={true}
            titleInfos={[{ id: windowData.id, title: windowData.title }]}
        />
    );

    // return <Block className={styles.preview} style={previewDimension} />;
}, styles);
