import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ stepId: string }>;
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { stepId } = await context.params;
    const body = await req.json();
    const { flirtId } = body;

    if (!flirtId || !stepId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const currentStep = await prisma.step.findUnique({ where: { id: stepId } });
    if (!currentStep) return NextResponse.json({ error: "Step not found" }, { status: 404 });

    const previousStep = await prisma.step.findFirst({
      where: { flirtId, order: currentStep.order - 1 },
      include: { 
        media: true,
        elements: true,
      },
    });

    if (!previousStep) return NextResponse.json({ error: "No previous step" }, { status: 404 });

    return NextResponse.json({ step: previousStep });
  } catch (err) {
    console.error("PREVIOUS STEP ERROR", err);
    return NextResponse.json({ error: "Failed to get previous step" }, { status: 500 });
  }
}
