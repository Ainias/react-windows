import * as React from 'react';
import { MouseEvent } from 'react';

import styles from './windowButton.scss';
import {
    Clickable,
    Icon,
    IconSource,
    Listener,
    RbmComponentProps,
    useListener,
    withMemo,
    WithNoChildren,
} from 'react-bootstrap-mobile';
import { ContainerState } from '../types/ContainerState';

export type WindowButtonProps<OnClickData> = RbmComponentProps<
    {
        icon: IconSource;
        title?: string;
        containerState?: ContainerState;
        hideWhenMaximized?: boolean;
        hideWhenMinimized?: boolean;
    } & Listener<'onClick', OnClickData, MouseEvent>,
    WithNoChildren
>;

export const WindowButton = withMemo(function WindowButton<OnClickData>({
    icon,
    title,
    containerState,
    hideWhenMaximized,
    hideWhenMinimized,
    ...listenerProps
}: WindowButtonProps<OnClickData>) {
    // Variables

    // Refs

    // States

    // Selectors

    // Callbacks
    const onClick = useListener('onClick', listenerProps);

    // Effects

    // Other

    // Render Functions
    if (hideWhenMaximized && containerState === ContainerState.MAXIMIZED) {
        return null;
    }
    if (hideWhenMinimized && containerState === ContainerState.MINIMIZED) {
        return null;
    }

    return (
        <Clickable onClick={onClick} className={styles.windowButton}>
            <Icon icon={icon} title={title} />
        </Clickable>
    );
},
styles);
