"use client";

import { useState } from "react";
import Link from "next/link";

interface Flirt {
  id: string;
  title: string;
  author: { email: string };
  steps: { id: string; order: number }[];
}

export default function FlirtsList({ initialFlirts }: { initialFlirts: Flirt[] }) {
  const [flirts, setFlirts] = useState(initialFlirts);

  const handleDelete = async (flirtId: string) => {
    if (!confirm("Are you sure you want to delete this flirt?")) return;

    const res = await fetch(`/api/flirts/${flirtId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) return alert("Failed to delete");

    // filter out deleted flirt
    setFlirts(flirts.filter((f) => f.id !== flirtId));
  };

  return (
    <ul className="space-y-2">
      {flirts.map((flirt) => {
        const firstStep = flirt.steps[0];

        return (
          <li key={flirt.id} className="flex items-center justify-between border p-2 rounded">
            <span>
              {flirt.title} - by {flirt.author.email}
              <span className="ml-2 text-gray-600 text-sm">
                ({flirt.steps.length} {flirt.steps.length === 1 ? "step" : "steps"})
              </span>
            </span>
            <div className="flex gap-2">
              {firstStep && (

                <Link
                  href={`/flirts/${flirt.id}/steps/${firstStep.id}`}
                  className="px-2 py-1 bg-yellow-400 text-black rounded hover:bg-yellow-500"
                >
                  Edit
                </Link>
              )}

              <Link
                href={`/flirts/${flirt.id}/slideshow`}
                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Slideshow
              </Link>

              <button
                onClick={() => handleDelete(flirt.id)}
                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
              
            </div>
          </li>
        );
      })}
    </ul>
  );
}
