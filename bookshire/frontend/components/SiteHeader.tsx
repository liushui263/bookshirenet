import Link from "next/link";
import { HeaderNav } from "@/components/HeaderNav";
import { SignOutButton } from "@/components/SignOutButton";
import { getCurrentUser } from "@/lib/session";

// The original bookshire.net top bar (styles in app/discovery.css), shown on every page.
export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <div className="discovery site-header">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="布客舍书坊 home">
          <span className="brand-mark">布</span>
          <div className="brand-copy">
            <div className="line">
              <strong>布客舍</strong>
              <span>
                <em className="special-char">书</em>
                <em className="special-char">坊</em>
              </span>
            </div>
            <small>Daily reading shelf</small>
          </div>
          <span className="brand-mark">書</span>
        </Link>

        <HeaderNav />

        <div className="topbar-account">
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
                Sign in
              </Link>
              <Link className="toplink toplink-primary" href="/register">
                Join
              </Link>
            </>
          )}
        </div>
      </header>
    </div>
  );
}
