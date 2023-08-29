import { WindowContainerDimension } from '../WindowContainer/WindowContainerDimension';
import type { WindowButtonData } from '../WindowContainer/WindowContainer';
import { CSSProperties, ReactNode } from 'react';
import { ContainerState } from '../types/ContainerState';
import { Position } from 'react-beautiful-dnd';
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
    buttons: (state: ContainerState, defaultButtons: WindowButtonData[]) => WindowButtonData[];
    children: ReactNode;
    className?: string;
    defaultWidth?: number;
    fillHeight: boolean;
    id: string;
    style?: CSSProperties;
    title: string;
};
declare const initialState: {
    activeContainerId: string;
    containers: Record<string, WindowContainerData>;
    draggingWindowId: string;
    windowContainerMapping: Record<string, string>;
    windowSize: {
        x: number;
        y: number;
    };
    windows: Record<string, WindowData>;
};
export type WindowStoreState = typeof initialState & ReturnType<typeof actionsGenerator>;
type SetState = (newState: WindowStoreState | Partial<WindowStoreState> | ((state: WindowStoreState) => WindowStoreState | Partial<WindowStoreState>), replace?: boolean) => void;
type GetState = () => Readonly<WindowStoreState>;
declare const actionsGenerator: (set: SetState, get: GetState) => {
    clear(): void;
    setWindow(window: WindowData, defaultContainerId?: string, isActiveOnOpen?: boolean): void;
    removeWindow(windowId: string): void;
    updateContainerDimension(id: string, dimension: WindowContainerDimension | undefined): void;
    updateContainerState(id: string, state: ContainerState | ((old: ContainerState) => ContainerState)): void;
    updateContainerActiveWindow(id: string, activeWindowId: string): void;
    setActiveContainer(id: string): void;
    setWindowSize(x: number, y: number): void;
    setButtonWidth(containerId: string, buttonWidth: number): void;
    setContainerIsMoving(containerId: string, isMoving: boolean): void;
    setContainerIsLocked(containerId: string, isLocked: boolean): void;
    setShouldResizeToContent(containerId: string, shouldResizeToContent: ResizeToContentEnum): void;
    setDefaultContainerData(containerId: string, defaultContainerData: Partial<Omit<WindowContainerData, "windowIds" | "id" | "buttonWidth" | "isMoving">>): void;
    updateDragging(windowId: string, mousePosition: Position, dimension: WindowContainerDimension, ignoredContainer?: string): string | undefined;
    clearDraggingWindow(): void;
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
