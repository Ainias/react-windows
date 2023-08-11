import { useMemo } from 'react';
import { WindowButtonData } from '../Components/WindowContainer/WindowContainer';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { getWindowStore } from '../Components/store/createWindowStore';
import {useTranslation} from "react-i18next";

export function useCloseButton(windowId: string, storeId = 'default', onClose?: () => any) {
    const {t} = useTranslation();
    return useMemo(
        () =>
            ({
                key: 'close-button',
                icon: faTimes,
                order: 30,
                title: t("window.button.close"),
                onClick: () => {
                    getWindowStore(storeId).getState().removeWindow(windowId);
                    onClose?.();
                },
            } as WindowButtonData),
        [onClose, storeId, t, windowId]
    );
}
