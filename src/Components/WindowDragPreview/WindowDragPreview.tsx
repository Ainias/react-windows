import React from 'react';
import { Block, withMemo } from 'react-bootstrap-mobile';
import { useDragLayer } from 'react-dnd';
import { getDragType } from '../helper/getDragType';
import { getWindowStore } from '../store/createWindowStore';
import styles from './windowDragPreview.scss';

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
    const dimension = useStore((s) => s.containers[s.windowContainerMapping[item?.id]]?.dimension);
    const isDraggingOver = useStore((s) => !!s.isDraggingOver);

    // Refs

    // States

    // Selectors

    // Callbacks

    // Effects

    // Other
    if (!isDragging || isDraggingOver || !dimension || !diff || !initialOffset) {
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

    // Render Functions

    return <Block className={styles.preview} style={previewDimension} />;
}, styles);
