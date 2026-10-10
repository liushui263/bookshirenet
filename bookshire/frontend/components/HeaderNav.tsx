"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Event the home page listens for, so list links switch its tab without a reload.
export const DISCOVERY_GOTO_EVENT = "discovery:goto";

const LIST_LINKS = [
  { sectionId: "zh-new-publish", tab: "zh", label: "中文榜单" },
  { sectionId: "en-new-publish", tab: "en", label: "English Lists" },
  { sectionId: "fr-best-year", tab: "intl", label: "EU Language Lists" },
];

const PAGE_LINKS = [
  { href: "/catalog", label: "Catalog" },
  { href: "/search", label: "Search" },
  { href: "/shelf", label: "My Shelf" },
];

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="topnav" aria-label="Primary">
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
