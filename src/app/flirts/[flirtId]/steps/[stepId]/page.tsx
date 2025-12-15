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

  const step = await prisma.step.findUnique({
    where: { id: stepId },
    include: { media: true },
  });

  if (!step) {
    notFound();
  }

  return (
    <StepPageClient initialFlirtId={flirtId} initialStep={step}
    />
  );
}
