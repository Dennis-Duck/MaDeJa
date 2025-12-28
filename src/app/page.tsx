import FlirtsList from "@/components/flirts/flirts-list";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const flirts = await prisma.flirt.findMany({
    include: {
      author: true,
      steps: { orderBy: { order: "asc" } },
    },
  });

  return (
    <div>
      <h1>Welcome</h1>
      <Link href="/wizard" className="px-2 py-1 bg-blue-500 text-white rounded">
        Start Wizard
      </Link>
      <FlirtsList initialFlirts={flirts} />
    </div>
  );
}
