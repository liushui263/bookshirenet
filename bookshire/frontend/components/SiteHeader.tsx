import Link from "next/link";
import { HeaderNav } from "@/components/HeaderNav";
import { SignOutButton } from "@/components/SignOutButton";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { getT } from "@/lib/i18n-server";
import { getCurrentUser } from "@/lib/session";

// The original bookshire.net top bar (styles in app/discovery.css), shown on every page.
export async function SiteHeader() {
  const [user, tr] = await Promise.all([getCurrentUser(), getT()]);

  return (
    <div className="discovery site-header">
      <header className="topbar">
        <Link className="brand" href="/" aria-label={tr("布客舍书坊 home", "布客舍书坊首页")}>
          <span className="brand-mark">布</span>
          <div className="brand-copy">
            <div className="line">
              <strong>布客舍</strong>
              <span>
                <em className="special-char">书</em>
                <em className="special-char">坊</em>
              </span>
            </div>
            <small>{tr("Daily reading shelf", "每日书架")}</small>
          </div>
          <span className="brand-mark">書</span>
        </Link>

        <HeaderNav />

        <div className="topbar-account">
          <LanguageSwitch />
          {user ? (
            <>
              <Link className="toplink" href="/shelf">
                {user.display_name}
              </Link>
              <SignOutButton className="toplink" />
            </>
          ) : (
            <>
              <Link className="toplink" href="/login">
                {tr("Sign in", "登录")}
              </Link>
              <Link className="toplink toplink-primary" href="/register">
                {tr("Join", "注册")}
              </Link>
            </>
          )}
        </div>
      </header>
    </div>
  );
}
