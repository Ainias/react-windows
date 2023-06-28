import { RbmComponentProps, WithNoStringAndChildrenProps } from '@ainias42/react-bootstrap-mobile';
import { WindowButtonData } from '../WindowContainer/WindowContainer';
import { ContainerState } from '../types/ContainerState';
export type WindowProps = RbmComponentProps<{
    id: string;
    title: string;
    defaultContainerId?: string;
    fillHeight?: boolean;
    buttons?: WindowButtonData[] | ((state: ContainerState, defaultButtons: WindowButtonData[]) => WindowButtonData[]);
    defaultWidth?: number;
    storeId?: string;
    onClose?: () => any;
}, WithNoStringAndChildrenProps>;
export declare const Window: ({ storeId, fillHeight, buttons, id, defaultContainerId, title, defaultWidth, children, onClose, className, style, }: WindowProps) => null;
