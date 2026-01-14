import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import StepPageClient from "./step-page-client";

export default async function Page({
  params,
}: {
  params: Promise<{ flirtId: string; stepId: string }>;
}) {
  const { flirtId, stepId } = await params;

  if (!stepId) {
    notFound();
  }

  const flirt = await prisma.flirt.findUnique({
    where: { id: flirtId },
    include: {
      author: true,
      steps: {
        include: {
          media: true,
          elements: {
            include: {
              textSegments: {
                orderBy: { order: 'asc' }
              }
            },
          },
          logics: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!flirt) {
    notFound();
  }

  const step = flirt.steps.find((s) => s.id === stepId);
  if (!step) {
    notFound();
  }

  const totalSteps = flirt.steps.length;

  return (
    <StepPageClient
      initialFlirtId={flirtId}
      initialStep={step}
      totalSteps={totalSteps}
      flirt={flirt}
    />
  );
}
