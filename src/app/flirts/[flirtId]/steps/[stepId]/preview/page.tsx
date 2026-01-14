import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import StepPreview from "@/components/preview/step-preview";

export default async function Page({
  params,
}: {
  params: Promise<{
    flirtId: string;
    stepId: string;
  }>;
}) {
  const stepId = (await params).stepId;

  if (!stepId) {
    notFound();
  }

  const step = await prisma.step.findUnique({
    where: { id: stepId },
    include: {
      media: true,
      logics: true,
      elements: {
          include: {
            textSegments: {
              orderBy: { order: 'asc' }
            }
          }
        },
    },
  });

  if (!step) {
    notFound();
  }

  return (
    <StepPreview
      step={step}
      flirtId={(await params).flirtId}
      stepId={(await params).stepId}
    />
  );
}
