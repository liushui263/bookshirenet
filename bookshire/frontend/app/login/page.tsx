import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { safeNext } from "@/lib/safeNext";
import { getCurrentUser } from "@/lib/session";

type PageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const next = safeNext((await searchParams).next);

  if (await getCurrentUser()) {
    redirect(next);
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight text-gray-950">Sign in</h1>
        <p className="mt-2 mb-8 text-gray-600">Welcome back to your library.</p>
        <AuthForm mode="login" next={next} />
      </section>
    </main>
  );
}
