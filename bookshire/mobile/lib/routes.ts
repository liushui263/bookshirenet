import type { Href } from "expo-router";

export type AppHref = Href;

export const ROUTES = {
  home: "/" as const,
  search: "/search" as const,
  shelf: "/shelf" as const,
};

export function firstRouteParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

export function requireRouteParam(value: string | string[] | undefined, name: string): string {
  const resolved = firstRouteParam(value);
  if (!resolved) {
    throw new Error(`Missing route param: ${name}`);
  }
  return resolved;
}

export function bookDetailHref(bookId: string): AppHref {
  return {
    pathname: "/books/[id]",
    params: { id: bookId },
  };
}

export function getDemoUserId(): string {
  return (
    process.env.EXPO_PUBLIC_DEMO_USER_ID ||
    "86f7818b-788e-4d0b-9e81-9c8bc918ac44"
  );
}
