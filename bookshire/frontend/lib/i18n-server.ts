import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, resolveLocale, translator, type Locale } from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  return resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value, headerList.get("accept-language"));
}

export async function getT() {
  return translator(await getLocale());
}
