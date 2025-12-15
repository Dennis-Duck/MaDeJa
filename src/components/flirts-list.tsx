import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function FlirtsList() {
  const flirts = await prisma.flirt.findMany({
    include: {
      author: true,
      steps: {
        orderBy: { order: "asc" },
        take: 1,
      },
    },
  });

  return (
    <ul className="space-y-2">
      {flirts.map((flirt) => {
        const firstStep = flirt.steps[0];

        return (
          <li key={flirt.id} className="flex items-center justify-between border p-2 rounded">
            <span>
              {flirt.title} - by {flirt.author.email}
            </span>
            {firstStep && (
              <Link
                href={`/flirts/${flirt.id}/steps/${firstStep.id}`}
                className="px-2 py-1 bg-yellow-400 text-black rounded hover:bg-yellow-500"
              >
                Edit
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
