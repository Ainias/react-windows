import i18n from "i18next";
import {initReactI18next} from "react-i18next";

import commonEn from "../../locales/en/common.json";
import commonDe from "../../locales/de/common.json";

i18n.use(initReactI18next).init({
    resources: {
        en: {
            common: commonEn
        },
        de: {
            common: commonDe
        },
    },
    defaultNS: "common",
    lng: "en",
    fallbackLng: "en",
    interpolation: {
        escapeValue: false
    }
});

export {i18n as reactWindowsI18n};
