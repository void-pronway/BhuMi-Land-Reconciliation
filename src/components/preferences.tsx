"use client";
import { createContext, useContext, useState } from "react";
import { copy, digits, translate, type Locale, type Key } from "@/lib/i18n";
type Preferences = {
  lang: Locale;
  theme: string;
  t: (key: Key | string) => string;
  n: (value: string | number) => string;
  setLang: (lang: Locale) => void;
  toggleTheme: () => void;
};
const Context = createContext<Preferences | null>(null);
export function PreferencesProvider({
  children,
  initialLang,
  initialTheme,
}: {
  children: React.ReactNode;
  initialLang: Locale;
  initialTheme: string;
}) {
  const [lang, updateLang] = useState(initialLang),
    [theme, updateTheme] = useState(initialTheme);
  function setLang(next: Locale) {
    updateLang(next);
    document.documentElement.lang = next;
    document.cookie = `bhumi_lang=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
  function toggleTheme() {
    const dark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    const next = dark ? "light" : "dark";
    updateTheme(next);
    document.documentElement.dataset.theme = next;
    document.cookie = `bhumi_theme=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
  return (
    <Context
      value={{
        lang,
        theme,
        t: (key) => translate(lang, key),
        n: (value) => digits(value, lang),
        setLang,
        toggleTheme,
      }}
    >
      {children}
    </Context>
  );
}
export function usePreferences() {
  const context = useContext(Context);
  if (!context) throw new Error("PreferencesProvider required");
  return context;
}
export type TranslationKey = keyof typeof copy.en;
