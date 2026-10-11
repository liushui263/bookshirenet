"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/LocaleProvider";

// Event the home page listens for, so list links switch its tab without a reload.
export const DISCOVERY_GOTO_EVENT = "discovery:goto";

export function HeaderNav() {
  const pathname = usePathname();
  const tr = useT();

  const LIST_LINKS = [
    { sectionId: "zh-new-publish", tab: "zh", label: tr("Chinese lists", "中文书单") },
    { sectionId: "en-new-publish", tab: "en", label: tr("English lists", "英文书单") },
    { sectionId: "fr-best-year", tab: "intl", label: tr("European lists", "欧洲语言书单") },
  ];

  const PAGE_LINKS = [
    { href: "/catalog", label: tr("Catalog", "书目") },
    { href: "/search", label: tr("Search", "搜索") },
    { href: "/shelf", label: tr("My Shelf", "我的书架") },
  ];

  return (
    <nav className="topnav" aria-label={tr("Primary", "主导航")}>
      {LIST_LINKS.map(({ sectionId, tab, label }) => (
        <Link
          key={sectionId}
          href={`/?tab=${tab}#${sectionId}`}
          onClick={(event) => {
            if (pathname !== "/") return;
            event.preventDefault();
            window.dispatchEvent(new CustomEvent(DISCOVERY_GOTO_EVENT, { detail: sectionId }));
          }}
        >
          {label}
        </Link>
      ))}
      {PAGE_LINKS.map(({ href, label }) => (
        <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
