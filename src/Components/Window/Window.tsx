import {useLayoutEffect, useRef} from 'react';
import {
    RbmComponentProps,
    useOnMount,
    withMemo,
    WithNoStringAndChildrenProps,
} from '@ainias42/react-bootstrap-mobile';
import {getWindowStore} from '../store/createWindowStore';
import {useCloseButton} from '../../hooks/useCloseButton';
import {Random} from "@ainias42/js-helper";

export type WindowProps = RbmComponentProps<
    {
        id: string;
        title: string;
        defaultContainerId?: string;
        fillHeight?: boolean;
        defaultWidth?: number;
        storeId?: string;
        onClose?: () => any;
        isActiveOnOpen?: boolean;
    },
    WithNoStringAndChildrenProps
>;

export const Window = withMemo(function Window({
                                                   storeId = 'default',
                                                   fillHeight = false,
                                                   id,
                                                   defaultContainerId,
                                                   title,
                                                   defaultWidth,
                                                   children,
                                                   onClose,
                                                   className,
                                                   style,
                                                   isActiveOnOpen = true,
                                               }: WindowProps) {
    // Variables
    const useStore = getWindowStore(storeId);
    const setWindow = useStore((s) => s.setWindow);
    const removeWindow = useStore((s) => s.removeWindow);
    const onCloseButton = useCloseButton(id, storeId, onClose);

    // Refs
    const nonce = useRef(Random.getStringRandom(5));

    // States

    // Selectors

    // Callbacks

    // Effects
    useLayoutEffect(() => {
        setWindow(
            {
                id,
                title,
                fillHeight,
                defaultWidth,
                onClose,
                children,
                className,
                style,
                nonce: nonce.current
            },
            defaultContainerId,
            isActiveOnOpen
        );
    }, [id, defaultContainerId, title, fillHeight, defaultWidth, children, onCloseButton, onClose, setWindow, className, style, isActiveOnOpen]);

    // remove window only if id changes or component is unmounted
    useOnMount(() => {
        return () => {
            if (removeWindow(id, nonce.current)) {
                onClose?.();
            }
        };
    });

    // Other

    // Render Functions

    return null;
});
