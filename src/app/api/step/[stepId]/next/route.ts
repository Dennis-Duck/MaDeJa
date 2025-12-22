import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ stepId: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { stepId } = await context.params;
    const body = await req.json();
    const { flirtId } = body;

    if (!flirtId) {
      return NextResponse.json(
        { error: "Missing flirtId" },
        { status: 400 }
      );
    }

    const steps = await prisma.step.findMany({
      where: { flirtId },
      orderBy: { order: "asc" },
      include: { media: true },
    });

    let nextStep;

    if (stepId) {
      const currentIndex = steps.findIndex(
        (step) => step.id === stepId
      );

      if (currentIndex !== -1 && currentIndex < steps.length - 1) {
        nextStep = steps[currentIndex + 1];
      }
    }

    if (!nextStep) {
      nextStep = await prisma.step.create({
        data: {
          flirtId,
          content: "",
          order: steps.length + 1,
        },
        include: { media: true },
      });
      steps.push(nextStep);
    }

    const totalSteps = steps.length;

    return NextResponse.json({ step: nextStep, totalSteps });
  } catch (err) {
    console.error("NEXT STEP ERROR", err);
    return NextResponse.json(
      { error: "Failed to get or create next step" },
      { status: 500 }
    );
  }
}
