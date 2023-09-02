import {TFunction} from "i18next";
import {useTranslation} from "react-i18next";
import {useMemo} from "react";

export function useT(key?: string): { t: TFunction; lang: string } {
    const {t: _t, i18n} = useTranslation(key);

    const lang = i18n.language;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(() => ({t: _t, lang}), [lang]);
}
