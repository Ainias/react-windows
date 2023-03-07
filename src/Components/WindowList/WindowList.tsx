import React, { useLayoutEffect } from 'react';
import { withMemo } from 'react-bootstrap-mobile';
import { getWindowStore } from '../store/createWindowStore';
import { WindowContainer } from '../WindowContainer/WindowContainer';
import { WindowDragPreview } from '../WindowDragPreview/WindowDragPreview';

export type WindowListProps = { store?: string };

export const WindowList = withMemo(function WindowList({ store = 'default' }: WindowListProps) {
    // Variables

    // Refs

    // States

    // Selectors
    const useStore = getWindowStore(store);
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
            <WindowDragPreview storeId={store} />
            {Object.keys(containers).map((container) => (
                <WindowContainer id={container} key={container} store={store} />
            ))}
        </>
    );
});
