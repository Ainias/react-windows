import { WindowContainerDimension } from '../WindowContainer/WindowContainerDimension';
import type { WindowButtonData } from '../WindowContainer/WindowContainer';
import { CSSProperties, ReactNode } from 'react';
import { ContainerState } from '../types/ContainerState';
import { Position } from 'react-beautiful-dnd';
export type WindowContainerData = {
    dimension?: WindowContainerDimension;
    state: ContainerState;
    windowIds: string[];
    activeWindowId: string;
    id: string;
    buttonWidth: number;
    isMoving: boolean;
};
export type WindowData = {
    id: string;
    title: string;
    fillHeight: boolean;
    buttons: (state: ContainerState, defaultButtons: WindowButtonData[]) => WindowButtonData[];
    defaultWidth?: number;
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
};
declare const initialState: {
    containers: Record<string, WindowContainerData>;
    windows: Record<string, WindowData>;
    windowContainerMapping: Record<string, string>;
    activeContainerId: string;
    windowSize: {
        x: number;
        y: number;
    };
};
export type WindowStoreState = typeof initialState & ReturnType<typeof actionsGenerator>;
type SetState = (newState: WindowStoreState | Partial<WindowStoreState> | ((state: WindowStoreState) => WindowStoreState | Partial<WindowStoreState>), replace?: boolean) => void;
type GetState = () => Readonly<WindowStoreState>;
declare const actionsGenerator: (set: SetState, get: GetState) => {
    clear(): void;
    setWindow(window: WindowData, defaultContainerId?: string): void;
    removeWindow(windowId: string): void;
    updateContainerDimension(id: string, dimension: WindowContainerDimension | undefined): void;
    updateContainerState(id: string, state: ContainerState | ((old: ContainerState) => ContainerState)): void;
    updateContainerActiveWindow(id: string, activeWindowId: string): void;
    setActiveContainer(id: string): void;
    setWindowSize(x: number, y: number): void;
    setButtonWidth(containerId: string, buttonWidth: number): void;
    setContainerIsMoving(containerId: string, isMoving: boolean): void;
    updateDragging(windowId: string, mousePosition: Position, dimension: WindowContainerDimension, ignoredContainer?: string): string | undefined;
};
export declare function getWindowStore(name?: string): import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<WindowStoreState>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<WindowStoreState, {
            containers: Record<string, WindowContainerData>;
            windowContainerMapping: Record<string, string>;
            windowSize: {
                x: number;
                y: number;
            };
        }>>) => void;
        clearStorage: () => void;
        rehydrate: () => void | Promise<void>;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: WindowStoreState) => void) => () => void;
        onFinishHydration: (fn: (state: WindowStoreState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<WindowStoreState, {
            containers: Record<string, WindowContainerData>;
            windowContainerMapping: Record<string, string>;
            windowSize: {
                x: number;
                y: number;
            };
        }>>;
    };
}>;
export {};
