"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
          describeError(body, isRegister ? "Could not create your account." : "Could not sign you in.")
        );
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
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
          <span className="text-sm font-semibold text-gray-900">Name</span>
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
        <span className="text-sm font-semibold text-gray-900">Email</span>
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
        <span className="text-sm font-semibold text-gray-900">Password</span>
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
          <span className="mt-1 block text-xs text-gray-500">At least 8 characters.</span>
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
        {isLoading ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
      </button>

      <p className="text-center text-sm text-gray-600">
        {isRegister ? "Already have an account?" : "New to BookShire?"}{" "}
        <Link href={otherHref} className="font-semibold text-gray-950 underline underline-offset-4">
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
