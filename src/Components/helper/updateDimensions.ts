import type { WindowContainerData } from '../store/createWindowStore';
import { changeDimension } from '../WindowContainer/changeDimension';
import { ArrayHelper } from 'js-helper';

export function updateDimensions(
    containers: Record<string, WindowContainerData>,
    oldWindowDimension: { x: number; y: number },
    newWindowDimension: { x: number; y: number }
) {
    if (
        (oldWindowDimension.x === newWindowDimension.x && oldWindowDimension.y === newWindowDimension.y) ||
        (oldWindowDimension.x === 0 && oldWindowDimension.y === 0)
    ) {
        return containers;
    }

    const diff = { x: oldWindowDimension.x - newWindowDimension.x, y: oldWindowDimension.y - newWindowDimension.y };

    const changedContainers = Object.values(containers).map((container) => {
        const { dimension } = container;
        if (!dimension) {
            return container;
        }
        const newDimension = changeDimension({ ...dimension }, diff.x, diff.y);
        return { ...container, dimension: newDimension };
    });
    return ArrayHelper.arrayToObject(changedContainers, (container) => container.id);
}
