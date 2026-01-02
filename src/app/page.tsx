import FlirtsList from "@/components/flirts/flirts-list";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/header";

export default async function Home() {
  const flirts = await prisma.flirt.findMany({
    include: {
      author: true,
      steps: { orderBy: { order: "asc" } },
    },
  });

  return (
    <>
      <Header />

      <main className="p-6">
        <h1>Welcome</h1>

        <Link
          href="/wizard"
          className="inline-block mt-2 px-2 py-1 rounded bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--hover-bg)] hover:text-[var(--foreground)] border border-[var(--border)] transition-colors duration-150"
        >
          Start Wizard
        </Link>
        <FlirtsList initialFlirts={flirts} />
      </main>
    </>
  );
}
