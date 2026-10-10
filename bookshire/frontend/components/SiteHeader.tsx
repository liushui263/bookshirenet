import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { getCurrentUser } from "@/lib/session";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4 text-sm">
        <Link href="/" className="text-base font-bold text-gray-950">
          BookShire
        </Link>
        <Link href="/search" className="font-semibold text-gray-600 hover:text-gray-950">
          Search
        </Link>
        <Link href="/shelf" className="font-semibold text-gray-600 hover:text-gray-950">
          My Shelf
        </Link>

        <div className="ml-auto flex items-center gap-4">
          {user ? (
            <>
              <span className="text-gray-600">{user.display_name}</span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="font-semibold text-gray-600 hover:text-gray-950">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-gray-950 px-4 py-2 font-semibold text-white hover:bg-gray-800"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
