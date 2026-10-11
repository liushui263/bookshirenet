import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { safeNext } from "@/lib/safeNext";
import { getT } from "@/lib/i18n-server";
import { getCurrentUser } from "@/lib/session";

type PageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function RegisterPage({ searchParams }: PageProps) {
  const next = safeNext((await searchParams).next);

  if (await getCurrentUser()) {
    redirect(next);
  }

  const tr = await getT();

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight text-gray-950">{tr("Create your account", "创建账号")}</h1>
        <p className="mt-2 mb-8 text-gray-600">{tr("Keep track of your books and share them with other readers.", "记录你的藏书，并与其他读者分享。")}</p>
        <AuthForm mode="register" next={next} />
      </section>
    </main>
  );
}
