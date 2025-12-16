import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { flirtId, currentStepId } = await req.json();

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

    if (currentStepId) {
      const currentIndex = steps.findIndex(
        (step) => step.id === currentStepId
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
