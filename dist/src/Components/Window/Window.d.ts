import { RbmComponentProps, WithNoStringAndChildrenProps } from '@ainias42/react-bootstrap-mobile';
export type WindowProps = RbmComponentProps<{
    id: string;
    title: string;
    defaultContainerId?: string;
    fillHeight?: boolean;
    defaultWidth?: number;
    storeId?: string;
    onClose?: () => any;
    isActiveOnOpen?: boolean;
}, WithNoStringAndChildrenProps>;
export declare const Window: ({ storeId, fillHeight, id, defaultContainerId, title, defaultWidth, children, onClose, className, style, isActiveOnOpen, }: WindowProps) => null;
