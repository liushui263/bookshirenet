"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/LocaleProvider";

type AuthFormProps = {
  mode: "login" | "register";
  next: string;
};

function describeError(body: unknown, fallback: string) {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
  return fallback;
}

export function AuthForm({ mode, next }: AuthFormProps) {
  const router = useRouter();
  const tr = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister
            ? { email, password, display_name: displayName }
            : { email, password }
        ),
      });
      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          describeError(body, isRegister
              ? tr("Could not create your account.", "无法创建账号。")
              : tr("Could not sign you in.", "无法登录。"))
        );
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError(tr("Network error. Please try again.", "网络错误，请重试。"));
    } finally {
      setIsLoading(false);
    }
  }

  const otherHref = `${isRegister ? "/login" : "/register"}?next=${encodeURIComponent(next)}`;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm"
    >
      {isRegister && (
        <label className="block">
          <span className="text-sm font-semibold text-gray-900">{tr("Name", "昵称")}</span>
          <input
            type="text"
            required
            maxLength={80}
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-950 outline-none focus:border-gray-950"
          />
        </label>
      )}

      <label className="block">
        <span className="text-sm font-semibold text-gray-900">{tr("Email", "邮箱")}</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-950 outline-none focus:border-gray-950"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-gray-900">{tr("Password", "密码")}</span>
        <input
          type="password"
          required
          minLength={isRegister ? 8 : 1}
          autoComplete={isRegister ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-950 outline-none focus:border-gray-950"
        />
        {isRegister && (
          <span className="mt-1 block text-xs text-gray-500">{tr("At least 8 characters.", "至少 8 个字符。")}</span>
        )}
      </label>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {isLoading
          ? tr("Please wait...", "请稍候…")
          : isRegister
            ? tr("Create account", "创建账号")
            : tr("Sign in", "登录")}
      </button>

      <p className="text-center text-sm text-gray-600">
        {isRegister
          ? tr("Already have an account?", "已有账号？")
          : tr("New to BookShire?", "初次来到布客舍书坊？")}{" "}
        <Link href={otherHref} className="font-semibold text-gray-950 underline underline-offset-4">
          {isRegister ? tr("Sign in", "登录") : tr("Create an account", "注册账号")}
        </Link>
      </p>
    </form>
  );
}
