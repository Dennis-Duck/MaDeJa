import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import StepPageClient from "./step-page-client";
import type { Step as StepType } from "@/types/step";

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

  /**
   * ============================================================
   * LAYER 1 + LAYER 2 INTEGRATION (NEW BEHAVIOUR)
   * ------------------------------------------------------------
   * - If the stepId exists in the DB, we use the real DB step.
   * - If it does NOT exist (e.g. a TEMP step created on the
   *   client and stored only in localStorage), we still render
   *   the page with a lightweight, in-memory Step object.
   *
   * This avoids a 404 when navigating to a temporary step that
   * only exists in the client-side structure state machine.
   * ============================================================
   */

  const dbStep = flirt.steps.find((s) => s.id === stepId);

  let initialStep: StepType;
  let totalSteps: number;

  if (dbStep) {
    // Normal case: use the persisted step
    initialStep = {
      id: dbStep.id,
      flirtId: dbStep.flirtId,
      order: dbStep.order,
      content: (dbStep as any).content ?? "",
      media: dbStep.media as any,
      elements: dbStep.elements as any,
      logics: dbStep.logics as any,
    };
    totalSteps = flirt.steps.length;
  } else {
    // TEMP step: provide a minimal in-memory step so the client
    // editor can hydrate its Layer 1 + Layer 2 state correctly.
    initialStep = {
      id: stepId,
      flirtId,
      order: flirt.steps.length + 1,
      content: "",
      media: [],
      elements: [],
      logics: [],
    };
    totalSteps = flirt.steps.length + 1;
  }

  return (
    <StepPageClient
      initialFlirtId={flirtId}
      initialStep={initialStep}
      totalSteps={totalSteps}
      flirt={flirt as any}
    />
  );
}
