// The site is shown in Chinese or English. The reader's choice is kept in a
// cookie; without one, the browser's preferred languages decide.
export type Locale = "zh" | "en";

export const LOCALE_COOKIE = "bookshire_lang";

export function isLocale(value: unknown): value is Locale {
  return value === "zh" || value === "en";
}

// Picks the first of the browser's languages that the site has, e.g.
// "zh-CN,zh;q=0.9,en;q=0.8" → zh. Anything else falls back to English.
export function resolveLocale(cookieValue?: string | null, acceptLanguage?: string | null): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  const preferred = (acceptLanguage ?? "")
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().toLowerCase().split(";");
      const q = params.find((param) => param.trim().startsWith("q="));
      return { tag, q: q ? Number(q.trim().slice(2)) || 0 : 1 };
    })
    .filter(({ tag }) => tag)
    .sort((a, b) => b.q - a.q);
  for (const { tag } of preferred) {
    if (tag.startsWith("zh")) return "zh";
    if (tag.startsWith("en")) return "en";
  }
  return "en";
}

// tr("Sign in", "登录"): every string is written in both languages where it is used.
export type Translate = (en: string, zh: string) => string;

export function translator(locale: Locale): Translate {
  return (en, zh) => (locale === "zh" ? zh : en);
}
