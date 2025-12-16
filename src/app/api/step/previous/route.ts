import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { flirtId, currentStepId } = await req.json();

  if (!flirtId || !currentStepId) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const currentStep = await prisma.step.findUnique({ where: { id: currentStepId } });
  if (!currentStep) return NextResponse.json({ error: "Step not found" }, { status: 404 });

  const previousStep = await prisma.step.findFirst({
    where: { flirtId, order: currentStep.order - 1 },
    include: { media: true },
  });

  if (!previousStep) return NextResponse.json({ error: "No previous step" }, { status: 404 });

  return NextResponse.json({ step: previousStep });
}
