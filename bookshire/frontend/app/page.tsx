import type { Metadata } from "next";
import DiscoveryHome, { type TabId } from "@/components/discovery/DiscoveryHome";
import { getDiscoveryBooks } from "@/lib/discovery/cache";
import { getCurrentUser } from "@/lib/session";
import "./discovery.css";

export const metadata: Metadata = {
  title: "BookShire",
  description:
    "A daily reading shelf of new and popular fiction in Chinese, English, French, Spanish, German and Russian, plus your own library.",
};

type PageProps = {
  searchParams: Promise<{ tab?: string | string[] }>;
};

function toTab(value: string | string[] | undefined): TabId {
  return value === "en" || value === "intl" ? value : "zh";
}

export default async function HomePage({ searchParams }: PageProps) {
  const [data, user, params] = await Promise.all([
    getDiscoveryBooks(),
    getCurrentUser(),
    searchParams,
  ]);

  return <DiscoveryHome data={data} signedIn={Boolean(user)} initialTab={toTab(params.tab)} />;
}
