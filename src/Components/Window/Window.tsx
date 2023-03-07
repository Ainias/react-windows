import { useLayoutEffect } from 'react';
import { RbmComponentProps, withMemo, WithNoStringAndChildrenProps } from 'react-bootstrap-mobile';
import { WindowButtonData } from '../WindowContainer/WindowContainer';
import { getWindowStore } from '../store/createWindowStore';
import { ContainerState } from '../types/ContainerState';

export type WindowProps = RbmComponentProps<
    {
        id: string;
        defaultContainerId?: string;
        title: string;
        fillHeight?: boolean;
        buttons?:
            | WindowButtonData[]
            | ((state: ContainerState, defaultButtons: WindowButtonData[]) => WindowButtonData[]);
        defaultWidth?: number;
        store?: string;
    },
    WithNoStringAndChildrenProps
>;

const emptyButtons: WindowButtonData[] = [];
export const Window = withMemo(function Window({
    store = 'default',
    fillHeight = true,
    buttons = emptyButtons,
    id,
    defaultContainerId,
    title,
    defaultWidth,
    children,
}: WindowProps) {
    // Variables
    const useStore = getWindowStore(store);
    const setWindow = useStore((s) => s.setWindow);

    // Refs

    // States

    // Selectors

    // Callbacks

    // Effects
    useLayoutEffect(() => {
        if (Array.isArray(buttons)) {
            const oldButtons = buttons;
            // eslint-disable-next-line react-hooks/exhaustive-deps
            buttons = (_, defaultButtons) => [...defaultButtons, ...oldButtons];
        }
        setWindow(
            {
                id,
                title,
                fillHeight,
                defaultWidth,
                buttons,
                children,
            },
            defaultContainerId
        );
    }, [id, defaultContainerId, title, fillHeight, defaultWidth, buttons, children]);

    // Other

    // Render Functions

    return null;
});
