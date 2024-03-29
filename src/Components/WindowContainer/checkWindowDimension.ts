import {
    WINDOW_CONTAINER_MIN_HEIGHT,
    WINDOW_CONTAINER_MIN_WIDTH,
    WindowContainerDimension,
} from './WindowContainerDimension';

export function checkWindowDimension(
    dimension: WindowContainerDimension,
    minWidth = WINDOW_CONTAINER_MIN_WIDTH,
    minHeight = WINDOW_CONTAINER_MIN_HEIGHT
) {
    dimension.top = Math.floor(Math.max(dimension.top, 0));
    dimension.left = Math.floor(Math.max(dimension.left, 0));
    dimension.right = Math.floor(Math.max(dimension.right, 0));
    dimension.bottom = Math.floor(Math.max(dimension.bottom, 0));

    if (window.innerWidth < minWidth + dimension.left + dimension.right) {
        if (dimension.right >= dimension.left) {
            dimension.right = window.innerWidth - minWidth - dimension.left;
        } else {
            dimension.left = window.innerWidth - minWidth - dimension.right;
        }
    }

    if (window.innerHeight < minHeight + dimension.top + dimension.bottom) {
        if (dimension.bottom >= dimension.top) {
            dimension.bottom = window.innerHeight - minHeight - dimension.top;
        } else {
            dimension.top = window.innerHeight - minHeight - dimension.bottom;
        }
    }

    return dimension;
}
