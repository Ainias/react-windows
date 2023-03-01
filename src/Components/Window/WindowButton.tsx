import * as React from 'react';
import { MouseEvent } from 'react';

import styles from './windowButton.scss';
import type { WindowState } from './Window';
import {
    Clickable,
    Icon,
    IconSource,
    Listener,
    RbmComponentProps,
    useListener, withMemo,
    WithNoChildren
} from "react-bootstrap-mobile";

export type WindowButtonProps<OnClickData> = RbmComponentProps<
    {
        icon: IconSource;
        title?: string;
        windowState?: WindowState;
        hideWhenMaximized?: boolean;
        hideWhenMinimized?: boolean;
    } & Listener<'onClick', OnClickData, MouseEvent>,
    WithNoChildren
>;

export const WindowButton = withMemo(function WindowButton<OnClickData>({
    icon,
    title,
    windowState,
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
    if (hideWhenMaximized && windowState === 'maximized') {
        return null;
    }
    if (hideWhenMinimized && windowState === 'minimized') {
        return null;
    }

    return (
        <Clickable onClick={onClick} className={styles.windowButton}>
            <Icon icon={icon} title={title} />
        </Clickable>
    );
}, styles);
