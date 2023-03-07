import { WindowContainerDimension } from './WindowContainerDimension';

export function changeDimension(dimension: WindowContainerDimension, addWidth: number, addHeight: number) {
    if (dimension.right >= dimension.left) {
        dimension.right -= addWidth;
    } else {
        dimension.left -= addWidth;
    }

    if (dimension.bottom >= dimension.top) {
        dimension.bottom -= addHeight;
    } else {
        dimension.top -= addHeight;
    }

    return dimension;
}

export function changeDimensionWidth(dimension: WindowContainerDimension, addWidth: number) {
    return changeDimension(dimension, addWidth, 0);
}

export function changeDimensionHeight(dimension: WindowContainerDimension, addHeight: number) {
    return changeDimension(dimension, 0, addHeight);
}
