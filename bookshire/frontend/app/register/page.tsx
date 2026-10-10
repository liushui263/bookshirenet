import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { safeNext } from "@/lib/safeNext";
import { getCurrentUser } from "@/lib/session";

type PageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function RegisterPage({ searchParams }: PageProps) {
  const next = safeNext((await searchParams).next);

  if (await getCurrentUser()) {
    redirect(next);
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight text-gray-950">Create your account</h1>
        <p className="mt-2 mb-8 text-gray-600">Keep track of your books and share them with other readers.</p>
        <AuthForm mode="register" next={next} />
      </section>
    </main>
  );
}
