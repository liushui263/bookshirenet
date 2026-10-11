"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

const OPTIONS: { locale: Locale; label: string; name: string }[] = [
  { locale: "zh", label: "中", name: "中文" },
  { locale: "en", label: "EN", name: "English" },
];

// Remembers the reader's choice for a year; the server renders in that language.
function saveLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguageSwitch() {
  const router = useRouter();
  const current = useLocale();

  function choose(locale: Locale) {
    if (locale === current) return;
    saveLocale(locale);
    router.refresh();
  }

  return (
    <div className="lang-switch" role="group" aria-label="Language / 语言">
      {OPTIONS.map(({ locale, label, name }) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          aria-pressed={current === locale}
          aria-label={name}
          className={current === locale ? "lang-active" : undefined}
          onClick={() => choose(locale)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
