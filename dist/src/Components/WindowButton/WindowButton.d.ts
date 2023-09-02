import { MouseEvent } from 'react';
import { IconSource, Listener, RbmComponentProps, WithNoChildren } from '@ainias42/react-bootstrap-mobile';
import { ContainerState } from '../types/ContainerState';
export type WindowButtonProps<OnClickData> = RbmComponentProps<{
    icon: IconSource;
    title?: string;
    containerState?: ContainerState;
    hideWhenMaximized?: boolean;
    hideWhenMinimized?: boolean;
    order?: number;
} & Listener<'onClick', OnClickData, MouseEvent>, WithNoChildren>;
export declare const WindowButton: <OnClickData>({ icon, title, containerState, hideWhenMaximized, hideWhenMinimized, className, style, ...listenerProps }: WindowButtonProps<OnClickData>) => JSX.Element | null;
