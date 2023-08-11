import { useEffect, useLayoutEffect } from 'react';
import {
    RbmComponentProps,
    useOnMount,
    withMemo,
    WithNoStringAndChildrenProps,
} from '@ainias42/react-bootstrap-mobile';
import { WindowButtonData } from '../WindowContainer/WindowContainer';
import { getWindowStore } from '../store/createWindowStore';
import { ContainerState } from '../types/ContainerState';
import { useCloseButton } from '../../hooks/useCloseButton';

export type WindowProps = RbmComponentProps<
    {
        id: string;
        title: string;
        defaultContainerId?: string;
        fillHeight?: boolean;
        buttons?:
            | WindowButtonData[]
            | ((state: ContainerState, defaultButtons: WindowButtonData[]) => WindowButtonData[]);
        defaultWidth?: number;
        storeId?: string;
        onClose?: () => any;
    },
    WithNoStringAndChildrenProps
>;

const emptyButtons: WindowButtonData[] = [];
export const Window = withMemo(function Window({
    storeId = 'default',
    fillHeight = false,
    buttons = emptyButtons,
    id,
    defaultContainerId,
    title,
    defaultWidth,
    children,
    onClose,
    className,
    style,
}: WindowProps) {
    // Variables
    const useStore = getWindowStore(storeId);
    const setWindow = useStore((s) => s.setWindow);
    const removeWindow = useStore((s) => s.removeWindow);
    const onCloseButton = useCloseButton(id, storeId, onClose);

    // Refs

    // States

    // Selectors

    // Callbacks

    // Effects
    useLayoutEffect(() => {
        let buttonFunction: (state: ContainerState, defaultButtons: WindowButtonData[]) => WindowButtonData[];
        if (Array.isArray(buttons)) {
            buttonFunction = (_, defaultButtons) => [...defaultButtons, ...buttons];
        } else {
            buttonFunction = buttons;
        }

        if (onClose) {
            const oldButtons = buttonFunction;
            buttonFunction = (containerState, defaultButtons) => [
                onCloseButton,
                ...oldButtons(containerState, defaultButtons),
            ];
        }

        setWindow(
            {
                id,
                title,
                fillHeight,
                defaultWidth,
                buttons: buttonFunction,
                children,
                className,
                style,
            },
            defaultContainerId
        );
    }, [
        id,
        defaultContainerId,
        title,
        fillHeight,
        defaultWidth,
        buttons,
        children,
        onCloseButton,
        onClose,
        setWindow,
        className,
        style,
    ]);

    // remove window only if id changes or component is unmounted
    useOnMount(() => {
        return () => {
            removeWindow(id);
            onClose?.();
        };
    });

    // Other

    // Render Functions

    return null;
});
