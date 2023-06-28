import { WindowButtonProps } from '../WindowButton/WindowButton';
import { WindowContainerData, WindowData } from '../store/createWindowStore';
export type WindowButtonData = WindowButtonProps<any> & {
    key: string;
};
export type WindowContainerProps = {
    id: string;
    store?: string;
    initialTop?: number;
    initialLeft?: number;
    containerData: WindowContainerData;
    titleInfos: {
        id: string;
        title: string;
    }[];
    windowData?: WindowData;
    isActive: boolean;
    disabled?: boolean;
    className?: string;
};
export type WindowContainerRef = {
    minimize(): void;
    maximize(): void;
    toggleMinimize(): void;
    toggleMaximize(): void;
    resizeToContent(): void;
    openInNewWindow(): void;
};
export declare const WindowContainer: import("@ainias42/react-bootstrap-mobile").RefComponent<WindowContainerProps, WindowContainerRef>;
