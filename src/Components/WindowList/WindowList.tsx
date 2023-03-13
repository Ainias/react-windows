import React, { useLayoutEffect } from 'react';
import { withMemo } from '@ainias42/react-bootstrap-mobile';
import { getWindowStore } from '../store/createWindowStore';
import { WindowContainerFromStore } from '../WindowContainer/WindowContainerFromStore';

export type WindowListProps = { storeId?: string };

export const WindowList = withMemo(function WindowList({ storeId = 'default' }: WindowListProps) {
    // Variables

    // Refs

    // States

    // Selectors
    const useStore = getWindowStore(storeId);
    const containers = useStore((s) => s.containers);
    const setWindowSize = useStore((s) => s.setWindowSize);

    // Callbacks

    // Effects
    useLayoutEffect(() => {
        setWindowSize(window.innerWidth, window.innerHeight);
        const listener = () => {
            setWindowSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, [setWindowSize]);

    // Other

    // Render Functions

    return (
        <>
            {Object.keys(containers).map((_, index, arr) => (
                <WindowContainerFromStore
                    id={arr[arr.length - 1 - index]}
                    key={arr[arr.length - 1 - index]}
                    store={storeId}
                />
            ))}
        </>
    );
});
