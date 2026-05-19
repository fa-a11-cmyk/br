import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import frCommon from "./locales/fr/common.json";
import frLanding from "./locales/fr/landing.json";
import frApp from "./locales/fr/app.json";
import frAuth from "./locales/fr/auth.json";

import enCommon from "./locales/en/common.json";
import enLanding from "./locales/en/landing.json";
import enApp from "./locales/en/app.json";
import enAuth from "./locales/en/auth.json";

import tnCommon from "./locales/tn/common.json";
import tnLanding from "./locales/tn/landing.json";
import tnApp from "./locales/tn/app.json";
import tnAuth from "./locales/tn/auth.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { common: frCommon, landing: frLanding, app: frApp, auth: frAuth },
      en: { common: enCommon, landing: enLanding, app: enApp, auth: enAuth },
      tn: { common: tnCommon, landing: tnLanding, app: tnApp, auth: tnAuth },
    },
    fallbackLng: "fr",
    defaultNS: "common",
    ns: ["common", "landing", "app", "auth"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "rapidomeet-lang",
      caches: ["localStorage"],
    },
  });

// RTL support for Tunisian Arabic
i18n.on("languageChanged", (lng) => {
  const dir = lng === "tn" ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lng === "tn" ? "ar-TN" : lng;
});

export default i18n;
