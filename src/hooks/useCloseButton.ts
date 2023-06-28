import { useMemo } from 'react';
import { WindowButtonData } from '../Components/WindowContainer/WindowContainer';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { getWindowStore } from '../Components/store/createWindowStore';

export function useCloseButton(windowId: string, storeId = 'default', onClose?: () => any) {
    return useMemo(
        () =>
            ({
                key: 'close-button',
                icon: faTimes,
                order: 30,
                onClick: () => {
                    getWindowStore(storeId).getState().removeWindow(windowId);
                    onClose?.();
                },
            } as WindowButtonData),
        [onClose, storeId, windowId]
    );
}
