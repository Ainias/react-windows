import create from 'zustand';
import { persist } from 'zustand/middleware';
import { WindowContainerDimension } from '../WindowContainer/WindowContainerDimension';
import type { WindowButtonData } from '../WindowContainer/WindowContainer';
import { Random } from 'js-helper';
import { ReactNode } from 'react';
import { updateDimensions } from '../helper/updateDimensions';
import { ContainerState } from '../types/ContainerState';
import { checkWindowDimension } from '../WindowContainer/checkWindowDimension';

export type WindowContainerData = {
    dimension?: WindowContainerDimension;
    state: ContainerState;
    windowIds: string[];
    activeWindowId: string;
    id: string;
};

type WindowData = {
    id: string;
    title: string;
    fillHeight: boolean;
    buttons: (state: ContainerState, defaultButtons: WindowButtonData[]) => WindowButtonData[];
    defaultWidth?: number;
    children: ReactNode;
};

const initialState = {
    containers: {} as Record<string, WindowContainerData>,
    windows: {} as Record<string, WindowData>,
    windowContainerMapping: {} as Record<string, string>,
    activeContainerId: '',
    windowSize: {
        x: 0,
        y: 0,
    },
    isDraggingOver: '',
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
    function generateUnusedContainerId() {
        const { containers } = get();
        for (let i = 0; i < 50; i++) {
            const id = Random.getStringRandom(16);
            if (!containers[id]) {
                return id;
            }
        }
        return undefined;
    }

    function removeWindowFromContainer(windowId: string) {
        const { windowContainerMapping, containers } = get();
        const container = containers[windowContainerMapping[windowId]];
        if (!container) {
            return;
        }
        container.windowIds = container.windowIds.filter((id) => id !== windowId);
        if (container.activeWindowId === windowId) {
            container.activeWindowId = '';
        }
        const newMapping = { ...windowContainerMapping };
        delete newMapping[windowId];
        set({ containers: { ...containers, [container.id]: container }, windowContainerMapping: newMapping });
    }

    function setWindow(window: WindowData, defaultContainerId?: string) {
        const { containers, windows, windowContainerMapping } = get();
        const containerId = windowContainerMapping[window.id] ?? defaultContainerId ?? generateUnusedContainerId();
        let container = containers[containerId];
        if (!container) {
            container = {
                state: ContainerState.NORMAL,
                windowIds: [],
                activeWindowId: window.id,
                id: containerId,
            };
        }
        if (windowContainerMapping[window.id] !== containerId) {
            container.windowIds = [...container.windowIds, window.id];
        }
        set({
            containers: { ...containers, [containerId]: container },
            windows: { ...windows, [window.id]: window as WindowData },
            windowContainerMapping: { ...windowContainerMapping, [window.id]: containerId },
        });
    }

    return {
        clear() {
            set({ ...actionsGenerator(set, get) }, true);
        },
        setWindow(window: WindowData, defaultContainerId?: string) {
            setWindow(window, defaultContainerId);
        },
        updateContainerDimension(id: string, dimension: WindowContainerDimension | undefined) {
            const container = get().containers[id];
            if (!container) {
                return;
            }
            set(({ containers }) => ({ containers: { ...containers, [id]: { ...container, dimension } } }));
        },
        updateContainerState(id: string, state: ContainerState | ((old: ContainerState) => ContainerState)) {
            const container = get().containers[id];
            if (!container) {
                return;
            }
            const newState = typeof state === 'function' ? state(container.state) : state;
            set(({ containers }) => ({ containers: { ...containers, [id]: { ...container, state: newState } } }));
        },
        updateContainerActiveWindow(id: string, activeWindowId: string) {
            const container = get().containers[id];
            if (!container) {
                return;
            }
            set(({ containers }) => ({
                containers: { ...containers, [id]: { ...container, activeWindowId } },
                activeContainerId: id,
            }));
        },
        setActiveContainer(id: string) {
            const container = get().containers[id];
            if (!container) {
                return;
            }
            set({ activeContainerId: id });
        },
        setWindowSize(x: number, y: number) {
            const { containers, windowSize } = get();
            const newWindowSize = { x, y };
            const newContainers = updateDimensions(containers, windowSize, newWindowSize);
            set({ containers: newContainers, windowSize: newWindowSize });
        },
        moveWindow(newContainerId: string, windowId: string, newIndex: number) {
            const { containers, windowContainerMapping } = get();
            const newContainer = containers[newContainerId];
            if (!newContainer) {
                return;
            }
            removeWindowFromContainer(windowId);

            newContainer.windowIds = [...newContainer.windowIds];
            newContainer.windowIds.splice(newIndex, 0, windowId);
            newContainer.activeWindowId = windowId;
            set({
                containers: { ...containers, [newContainerId]: newContainer },
                windowContainerMapping: { ...windowContainerMapping, [windowId]: newContainerId },
                activeContainerId: newContainerId,
            });
        },
        moveWindowToOwnContainer(windowId: string, position: { x: number; y: number } | null) {
            const { windows, containers, windowContainerMapping } = get();
            const window = windows[windowId];
            const container = containers[windowContainerMapping[windowId]];
            if (!window || !container) {
                return;
            }
            const dimension = container.dimension ? { ...container.dimension } : undefined;

            removeWindowFromContainer(windowId);
            setWindow(window);
            if (dimension && position) {
                const { windowContainerMapping: newMapping, containers: newContainers } = get();
                const newContainer = newContainers[newMapping[windowId]];
                dimension.right += dimension.left - position.x;
                dimension.bottom += dimension.top - position.y;
                dimension.left = position.x;
                dimension.top = position.y;
                newContainer.dimension = checkWindowDimension(dimension);
                set({
                    containers: { ...newContainers, [newContainer.id]: newContainer },
                    activeContainerId: newContainer.id,
                });
            }
        },
        setIsDraggingOver(id: string) {
            set({ isDraggingOver: id });
        },
        removeIsDraggingOver(id: string) {
            set(({ isDraggingOver }) => ({
                isDraggingOver: isDraggingOver === id ? '' : isDraggingOver,
            }));
        },
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
                partialize: ({ containers, windowContainerMapping, windowSize }) => ({
                    containers,
                    windowContainerMapping,
                    windowSize,
                }),
                onRehydrateStorage: () => {
                    return (state) => {
                        // can change state directly here
                        if (state) {
                            const newWindowSize = { x: window.innerWidth, y: window.innerHeight };
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
