import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { safeNext } from "@/lib/safeNext";
import { getT } from "@/lib/i18n-server";
import { getCurrentUser } from "@/lib/session";

type PageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const next = safeNext((await searchParams).next);

  if (await getCurrentUser()) {
    redirect(next);
  }

  const tr = await getT();

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight text-gray-950">{tr("Sign in", "登录")}</h1>
        <p className="mt-2 mb-8 text-gray-600">{tr("Welcome back to your library.", "欢迎回到你的书房。")}</p>
        <AuthForm mode="login" next={next} />
      </section>
    </main>
  );
}
