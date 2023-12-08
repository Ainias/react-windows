import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WindowContainerDimension } from '../WindowContainer/WindowContainerDimension';
import { ObjectHelper, Random } from '@ainias42/js-helper';
import { CSSProperties, ReactNode } from 'react';
import { updateDimensions } from '../helper/updateDimensions';
import { ContainerState } from '../types/ContainerState';
import { checkWindowDimension } from '../WindowContainer/checkWindowDimension';
import { Position } from 'react-beautiful-dnd';
import { checkOverContainerAndTabPosition } from '../helper/checkOverContainerAndTabPosition';
import { ResizeToContentEnum } from "../WindowContainer/ResizeToContentEnum";

export type WindowContainerData = {
    buttonWidth: number;
    id: string;
    windowIds: string[];
    activeWindowId: string;
    isMoving: boolean;
    shouldResizeToContent: ResizeToContentEnum;
    isLocked: boolean;
    state: ContainerState;
    dimension?: WindowContainerDimension;
};

export type WindowData = {
    onClose?: () => any;
    children: ReactNode;
    className?: string;
    defaultWidth?: number;
    fillHeight: boolean;
    id: string;
    style?: CSSProperties;
    title: string;
    nonce: string;
};

const initialState = {
    activeContainerId: '',
    containers: {} as Record<string, WindowContainerData>,
    draggingWindowId: '',
    windowContainerMapping: {} as Record<string, string>,
    windowSize: {
        x: 0,
        y: 0,
    },
    windows: {} as Record<string, WindowData>,
};
export type WindowStoreState = typeof initialState & ReturnType<typeof actionsGenerator>;

type SetState = (
    newState:
        | WindowStoreState
        | Partial<WindowStoreState>
        | ((state: WindowStoreState) => WindowStoreState | Partial<WindowStoreState>),
    replace?: boolean
) => void;
type GetState = () => Readonly<WindowStoreState>;

const actionsGenerator = (set: SetState, get: GetState) => {

    function generateDefaultContainer() {
        return {
            state: ContainerState.NORMAL,
            windowIds: [],
            activeWindowId: "",
            buttonWidth: 0,
            isLocked: false,
            isMoving: false,
            shouldResizeToContent: ResizeToContentEnum.RESIZE
        };
    }

    function generateUnusedContainerId() {
        const {containers} = get();
        for (let i = 0; i < 50; i++) {
            const id = Random.getStringRandom(16);
            if (!containers[id]) {
                return id;
            }
        }
        return undefined;
    }

    function removeWindowFromContainer(windowId: string) {
        const {windowContainerMapping, containers} = get();
        const container = containers[windowContainerMapping[windowId]];
        if (!container) {
            return;
        }
        container.windowIds = container.windowIds.filter((id) => id !== windowId);
        if (container.activeWindowId === windowId) {
            container.activeWindowId = '';
        }
        const newMapping = {...windowContainerMapping};
        delete newMapping[windowId];

        const newContainers = {...containers, [container.id]: container};
        if (container.windowIds.length === 0) {
            delete newContainers[container.id];
        }
        set({containers: newContainers, windowContainerMapping: newMapping});
    }

    function setWindow(window: WindowData, defaultContainerId?: string, isActiveOnOpen?: boolean) {
        const {containers, windows, windowContainerMapping} = get();
        const containerId = windowContainerMapping[window.id] ?? defaultContainerId ?? generateUnusedContainerId();
        let container = containers[containerId];
        if (!container) {
            container = {
                ...generateDefaultContainer(),
                activeWindowId: window.id,
                id: containerId,
            };
        }
        if (windowContainerMapping[window.id] !== containerId) {
            container.windowIds = [...container.windowIds, window.id];
        }

        if (!windows[window.id] && isActiveOnOpen) {
            container.activeWindowId = window.id;
            set({activeContainerId: container.id});
        }

        set({
            containers: {...containers, [containerId]: container},
            windows: {...windows, [window.id]: window as WindowData},
            windowContainerMapping: {...windowContainerMapping, [window.id]: containerId},
        });
    }

    function moveWindowToOwnContainer(windowId: string, position: { x: number; y: number } | null) {
        const {windows, containers, windowContainerMapping} = get();
        const window = windows[windowId];
        const container = containers[windowContainerMapping[windowId]];
        if (!window || !container) {
            return;
        }
        const dimension = container.dimension ? {...container.dimension} : undefined;

        removeWindowFromContainer(windowId);
        setWindow(window);
        if (dimension && position) {
            const {windowContainerMapping: newMapping, containers: newContainers} = get();
            const newContainer = newContainers[newMapping[windowId]];
            dimension.right += dimension.left - position.x;
            dimension.bottom += dimension.top - position.y;
            dimension.left = position.x;
            dimension.top = position.y;
            newContainer.dimension = checkWindowDimension(dimension);
            newContainer.buttonWidth = container.buttonWidth;
            set({
                containers: {...containers, [newContainer.id]: newContainer},
                activeContainerId: newContainer.id,
            });
        }
    }

    function moveWindow(windowId: string, newContainerId: string, newIndex: number) {
        const {containers, windowContainerMapping} = get();
        const newContainer = containers[newContainerId];
        const container = containers[windowContainerMapping[windowId]];
        if (!newContainer || (newContainer.id === container?.id && container?.windowIds.indexOf(windowId) === newIndex)) {
            return;
        }

        removeWindowFromContainer(windowId);

        newContainer.windowIds = [...newContainer.windowIds];
        newContainer.windowIds.splice(newIndex, 0, windowId);
        newContainer.activeWindowId = windowId;
        set({
            containers: {...containers, [newContainerId]: newContainer},
            windowContainerMapping: {...windowContainerMapping, [windowId]: newContainerId},
            activeContainerId: newContainerId,
        });
    }

    function updateContainerDimension(id: string, dimension: WindowContainerDimension | undefined, resizeNeighbours = false) {
        const {containers: currentContainers, windowSize} = get();
        const container = currentContainers[id];
        if (!container) {
            return;
        }

        const currentDimension = container.dimension;

        if (dimension && currentDimension && resizeNeighbours) {
            const sitesToCheck = {
                top: windowSize.y - currentDimension.bottom,
                bottom: windowSize.y - currentDimension.top,
                left: windowSize.x - currentDimension.right,
                right: windowSize.x - currentDimension.left,
            };

            const containersToChange: {
                top: string[];
                bottom: string[];
                left: string[];
                right: string[];
            } = {
                top: [],
                bottom: [],
                left: [],
                right: [],
            };

            const diff = 5;
            ObjectHelper.values(currentContainers).forEach(c => {
                if (c.id === id || !c.dimension) {
                    return;
                }

                if (Math.abs(c.dimension.top - sitesToCheck.top) < diff
                    && c.dimension.left < windowSize.x - currentDimension.right
                    && c.dimension.right < windowSize.x - currentDimension.left) {
                    containersToChange.top.push(c.id);
                } else if (Math.abs(c.dimension.bottom - sitesToCheck.bottom) < diff
                    && c.dimension.left < windowSize.x - currentDimension.right
                    && c.dimension.right < windowSize.x - currentDimension.left) {
                    containersToChange.bottom.push(c.id);
                } else if (Math.abs(c.dimension.left - sitesToCheck.left) < diff
                    && c.dimension.top < windowSize.y - currentDimension.bottom
                    && c.dimension.bottom < windowSize.y - currentDimension.top) {
                    containersToChange.left.push(c.id);
                } else if (Math.abs(c.dimension.right - sitesToCheck.right) < diff
                    && c.dimension.top < windowSize.y - currentDimension.bottom
                    && c.dimension.bottom < windowSize.y - currentDimension.top) {
                    containersToChange.right.push(c.id);
                }
            });

            const diffDimension = {
                top: currentDimension.bottom - dimension.bottom,
                bottom: currentDimension.top - dimension.top,
                left: currentDimension.right - dimension.right,
                right: currentDimension.left - dimension.left,
            };

            const changedContainers: Record<string, WindowContainerData> = {};
            ObjectHelper.entries(containersToChange).forEach(([direction, containerIds]) => {
                containerIds.forEach(containerId => {
                    const currentContainer = currentContainers[containerId];
                    if (!currentContainer.dimension) {
                        return;
                    }

                    const newDimension = {...currentContainer.dimension, [direction]: currentContainer.dimension[direction] + diffDimension[direction]};
                    let newResizeToContent = currentContainer.shouldResizeToContent;
                    if ((direction === "top" || direction === "bottom") && newResizeToContent !== ResizeToContentEnum.WIDTH_ONLY) {
                        if (newResizeToContent === ResizeToContentEnum.RESIZE) {
                            newResizeToContent = ResizeToContentEnum.WIDTH_ONLY;
                        } else {
                            newResizeToContent = ResizeToContentEnum.NONE;
                        }
                    } else if ((direction === "left" || direction === "right") && newResizeToContent !== ResizeToContentEnum.HEIGHT_ONLY) {
                        if (newResizeToContent === ResizeToContentEnum.RESIZE) {
                            newResizeToContent = ResizeToContentEnum.HEIGHT_ONLY;
                        } else {
                            newResizeToContent = ResizeToContentEnum.NONE;
                        }
                    }

                    changedContainers[currentContainer.id] = {
                        ...currentContainer,
                        dimension: newDimension,
                        shouldResizeToContent: newResizeToContent,
                    };
                });
            });

            set(({containers}) => ({containers: {...containers, ...changedContainers}}));
        }

        set(({containers}) => ({containers: {...containers, [id]: {...container, dimension}}}));
    }

    return {
        clear() {
            set({...actionsGenerator(set, get)}, true);
        },
        setWindow(window: WindowData, defaultContainerId?: string, isActiveOnOpen?: boolean) {
            setWindow(window, defaultContainerId, isActiveOnOpen);
        },
        removeWindow(windowId: string, nonce?: string) {
            const {windows} = get();
            const newWindows = {...windows};
            if (nonce && newWindows[windowId]?.nonce !== nonce) {
                return false;
            }
            delete newWindows[windowId];
            set({windows: newWindows});
            return true;
        },
        updateContainerDimension(id: string, dimension: WindowContainerDimension | undefined, resizeNeighbours = true) {
            updateContainerDimension(id, dimension, resizeNeighbours);
        },
        updateContainerState(id: string, state: ContainerState | ((old: ContainerState) => ContainerState)) {
            const container = get().containers[id];
            if (!container) {
                return;
            }
            const newState = typeof state === 'function' ? state(container.state) : state;
            set(({containers}) => ({containers: {...containers, [id]: {...container, state: newState}}}));
        },
        updateContainerActiveWindow(id: string, activeWindowId: string) {
            const container = get().containers[id];
            if (!container) {
                return;
            }
            if (container.state === ContainerState.MINIMIZED) {
                container.state = ContainerState.NORMAL;
            }

            set(({containers}) => ({
                containers: {...containers, [id]: {...container, activeWindowId}},
                activeContainerId: id,
            }));
        },
        setActiveContainer(id: string) {
            const container = get().containers[id];
            if (!container) {
                return;
            }
            set({activeContainerId: id});
        },
        setActiveWindow(windowId: string) {
            const {containers, windows, windowContainerMapping} = get();
            if (!windows[windowId]) {
                return;
            }
            const containerId = windowContainerMapping[windowId];
            const container = containers[containerId];
            if (!container) {
                return;
            }
            if (container.state === ContainerState.MINIMIZED) {
                container.state = ContainerState.NORMAL;
            }
            container.activeWindowId = windowId;

            set({activeContainerId: containerId, containers: {...containers, [containerId]: {...container}}});
        },
        setWindowSize(x: number, y: number) {
            const {containers, windowSize} = get();
            const newWindowSize = {x, y};
            const newContainers = updateDimensions(containers, windowSize, newWindowSize);
            set({containers: newContainers, windowSize: newWindowSize});
        },
        setButtonWidth(containerId: string, buttonWidth: number) {
            const {containers} = get();
            const container = containers[containerId];
            if (!container) {
                return;
            }
            container.buttonWidth = buttonWidth;
            set({containers: {...containers, [containerId]: {...container}}});
        },
        setContainerIsMoving(containerId: string, isMoving: boolean) {
            const {containers} = get();
            const container = containers[containerId];
            if (!container) {
                return;
            }
            container.isMoving = isMoving;
            set({containers: {...containers, [containerId]: {...container}}});
        },
        setContainerIsLocked(containerId: string, isLocked: boolean) {
            const {containers} = get();
            const container = containers[containerId];
            if (!container) {
                return;
            }
            container.isLocked = isLocked;
            set({containers: {...containers, [containerId]: {...container}}});
        },
        setShouldResizeToContent(containerId: string, shouldResizeToContent: ResizeToContentEnum) {
            const {containers} = get();
            const container = containers[containerId];
            if (!container) {
                return;
            }
            container.shouldResizeToContent = shouldResizeToContent;
            set({containers: {...containers, [containerId]: {...container}}});
        },
        setDefaultContainerData(containerId: string, defaultContainerData: Partial<Omit<WindowContainerData, "windowIds" | "id" | "buttonWidth" | "isMoving">>) {
            const {containers} = get();
            let container = containers[containerId];
            if (container) {
                return;
            }
            container = {
                ...generateDefaultContainer(),
                ...defaultContainerData,
                id: containerId,
            };
            set({containers: {...containers, [containerId]: container}});
        },
        updateDragging(
            windowId: string,
            mousePosition: Position,
            dimension: WindowContainerDimension,
            ignoredContainer?: string
        ) {
            set({draggingWindowId: windowId});
            const {containers, windows, windowContainerMapping} = get();
            const newContainerData = checkOverContainerAndTabPosition(
                Object.values(containers),
                mousePosition,
                windows,
                ignoredContainer
            );
            if (newContainerData) {
                moveWindow(windowId, newContainerData.container, newContainerData.index);
                return undefined;
            }

            const currentContainerId = windowContainerMapping[windowId];
            if (ignoredContainer !== currentContainerId) {
                moveWindowToOwnContainer(windowId, {x: dimension.left, y: dimension.top});
            }
            const {windowContainerMapping: newWindowContainerMapping, containers: newContainers} = get();
            const newId = newWindowContainerMapping[windowId];
            updateContainerDimension(newId, dimension, false);
            if (!newContainers[newId].isMoving) {
                set({containers: {...newContainers, [newId]: {...newContainers[newId], isMoving: true}}});
            }
            set({activeContainerId: newId});
            return newId;
        },
        closeContainer(containerId: string) {
            const {containers: {[containerId]: container}, windows} = get();
            if (!container) {
                return;
            }
            container.windowIds.forEach(id => {
                windows[id]?.onClose?.();
            });
        },
        clearDraggingWindow() {
            set({draggingWindowId: ''});
        },
        moveWindow,
    };
};

const stores: Record<string, ReturnType<typeof createWindowStore>> = {};

function createWindowStore(name: string) {
    return create<WindowStoreState>()(
        persist(
            (set, get) => ({
                ...initialState,
                ...actionsGenerator(set, get),
            }),
            {
                name: `window-store-${name}`,
                version: 0,
                partialize: ({containers, windowContainerMapping, windowSize}) => ({
                    containers,
                    windowContainerMapping,
                    windowSize,
                }),
                onRehydrateStorage: () => {
                    return (state) => {
                        // can change state directly here
                        if (state) {
                            const newWindowSize = {x: window.innerWidth, y: window.innerHeight};
                            state.containers = updateDimensions(state.containers, state.windowSize, newWindowSize);

                            // remove duplicates
                            Object.values(state.containers).forEach(
                                (container) => (container.windowIds = [...new Set(container.windowIds)])
                            );

                            // ensure every existing connection is in both directions
                            Object.entries(state.windowContainerMapping).forEach(([windowId, containerId]) => {
                                const container = state.containers[containerId];
                                const index = container?.windowIds.indexOf(windowId) ?? 0;
                                if (index === -1) {
                                    container.windowIds.push(windowId);
                                }
                            });
                            state.windowSize = newWindowSize;
                        }
                    };
                },
            }
        )
    );
}

export function getWindowStore(name = 'default') {
    if (!stores[name]) {
        stores[name] = createWindowStore(name);
    }
    return stores[name];
}
