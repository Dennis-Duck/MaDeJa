import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ stepId: string }>;
}

// GET - Fetch a specific step
export async function GET(req: Request, context: RouteContext) {
  try {
    const { stepId } = await context.params;

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

// POST - Create a new step
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { flirtId } = body;

    if (!flirtId) {
      return NextResponse.json({ error: "Missing flirtId" }, { status: 400 });
    }

    const order = await prisma.step.count({
      where: { flirtId },
    }) + 1;

    const step = await prisma.step.create({
      data: {
        flirtId,
        content: "",
        order: order,
      },
      include: { media: true },
    });

    return NextResponse.json({ step });
  } catch (err) {
    console.error("CREATE STEP ERROR", err);
    return NextResponse.json({ error: "Failed to create step" }, { status: 500 });
  }
}

// DELETE - Delete a step
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { stepId } = await context.params;

    if (!stepId) {
      return NextResponse.json({ error: "Missing stepId" }, { status: 400 });
    }

    const step = await prisma.step.findUnique({
      where: { id: stepId },
    });

    if (!step) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 });
    }

    // Delete the step (cascading delete will remove media automatically)
    await prisma.step.delete({
      where: { id: stepId },
    });

    // Update order of remaining steps
    await prisma.step.updateMany({
      where: {
        flirtId: step.flirtId,
        order: { gt: step.order },
      },
      data: {
        order: { decrement: 1 },
      },
    });

    const previousStep = await prisma.step.findFirst({
      where: { flirtId: step.flirtId, order: step.order - 1 },
      include: { media: true },
    });

    return NextResponse.json({ success: true, previousStep });
  } catch (err) {
    console.error("DELETE STEP ERROR", err);
    return NextResponse.json({ error: "Failed to delete step" }, { status: 500 });
  }
}
