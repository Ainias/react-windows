import type { WindowContainerData } from '../store/createWindowStore';
import { Position } from '../hooks/useOnMouseDrag';
import { WindowConstants } from './WindowConstants';

export function checkOverContainerAndTabPosition(
    containers: WindowContainerData[],
    position: Position,
    windows: Record<string, any>,
    excludedContainerId?: string
) {
    let foundContainer: string | undefined;
    let index: number | undefined;

    containers.some((container) => {
        if (!container.dimension || container.id === excludedContainerId || container.windowIds.length === 0) {
            return false;
        }
        if (
            container.dimension.left <= position.x &&
            container.dimension.right <= window.innerWidth - position.x &&
            container.dimension.top <= position.y &&
            container.dimension.top + WindowConstants.TITLE_HEIGHT >= position.y &&
            container.windowIds.some(windowId => !!windows[windowId])
        ) {
            foundContainer = container.id;
            const width =
                window.innerWidth -
                container.dimension.left -
                container.dimension.right -
                container.buttonWidth -
                WindowConstants.TAB_BAR_GRAB_WIDTH -
                2 * WindowConstants.TITLE_PADDING;

            const tabWidth = width / container.windowIds.length;
            const relativeXPosition = position.x - container.dimension.left + WindowConstants.TITLE_PADDING;
            index = Math.floor(relativeXPosition / tabWidth);

            return true;
        }

        return false;
    });

    if (foundContainer) {
        return {
            container: foundContainer as string,
            index: index as number,
        };
    }
    return undefined;
}
