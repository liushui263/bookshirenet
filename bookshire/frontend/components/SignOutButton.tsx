"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/LocaleProvider";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const tr = useT();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isLoading}
      className={
        className ??
        "rounded-full border border-gray-300 px-4 py-2 font-semibold text-gray-900 hover:bg-gray-100 disabled:opacity-50"
      }
    >
      {tr("Sign out", "退出登录")}
    </button>
  );
}
