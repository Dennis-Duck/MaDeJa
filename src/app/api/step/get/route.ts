import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { stepId } = await req.json();

    if (!stepId) {
      return NextResponse.json({ error: "Missing stepId" }, { status: 400 });
    }

    const step = await prisma.step.findUnique({
      where: { id: stepId },
      include: { media: true },
    });

    if (!step) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 });
    }

    const totalSteps = await prisma.step.count({ where: { flirtId: step.flirtId } });

    return NextResponse.json({ step, totalSteps });
  } catch (err) {
    console.error("GET STEP ERROR", err);
    return NextResponse.json({ error: "Failed to get step" }, { status: 500 });
  }
}
