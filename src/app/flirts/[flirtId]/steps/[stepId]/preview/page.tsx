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
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  // When step not in DB, it may be a temp step (unsaved) – render anyway and let
  // StepPreview use editor context (getStepState) for unsaved data
  const { flirtId } = await params;

  return (
    <StepPreview
      stepFromDb={step}
      flirtId={flirtId}
      stepId={stepId}
    />
  );
}
