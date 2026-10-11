import type { Metadata } from "next";
import DiscoveryHome, { type TabId } from "@/components/discovery/DiscoveryHome";
import { getDiscoveryBooks } from "@/lib/discovery/cache";
import { getLocale, getT } from "@/lib/i18n-server";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return {
    title: "布客舍书坊",
    description: tr(
      "A daily reading shelf of new books and popular fiction in Chinese, English, French, Spanish, German and Russian, plus your own library.",
      "每日更新的书墙：中文、英文、法语、西班牙语、德语和俄语的新书与热门小说，还有你自己的书架。"
    ),
  };
}

type PageProps = {
  searchParams: Promise<{ tab?: string | string[] }>;
};

// Without ?tab=, English readers start on the English lists.
function toTab(value: string | string[] | undefined, fallback: TabId): TabId {
  return value === "zh" || value === "en" || value === "intl" ? value : fallback;
}

export default async function HomePage({ searchParams }: PageProps) {
  const [data, user, params, locale] = await Promise.all([
    getDiscoveryBooks(),
    getCurrentUser(),
    searchParams,
    getLocale(),
  ]);

  return (
    <DiscoveryHome
      data={data}
      signedIn={Boolean(user)}
      initialTab={toTab(params.tab, locale === "zh" ? "zh" : "en")}
    />
  );
}
