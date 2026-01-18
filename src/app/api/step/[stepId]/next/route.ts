import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteContext {
  params: Promise<{ stepId: string }>
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { stepId } = await context.params

    if (!stepId) {
      return NextResponse.json({ error: "Missing stepId" }, { status: 400 })
    }

    const currentStep = await prisma.step.findUnique({
      where: { id: stepId },
    })

    if (!currentStep) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 })
    }

    const nextStep = await prisma.step.findFirst({
      where: {
        flirtId: currentStep.flirtId,
        order: currentStep.order + 1,
      },
      include: {
        media: true,
        elements: {
          include: {
            textSegments: {
              orderBy: { order: "asc" },
            },
          },
        },
        logics: true,
      },
    })

    if (!nextStep) {
      return NextResponse.json({ error: "No next step" }, { status: 404 })
    }

    return NextResponse.json({ step: nextStep })
  } catch (err) {
    console.error("GET NEXT STEP ERROR", err)
    return NextResponse.json({ error: "Failed to get next step" }, { status: 500 })
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { stepId } = await context.params

    if (!stepId) {
      return NextResponse.json({ error: "Missing stepId" }, { status: 400 })
    }

    const currentStep = await prisma.step.findUnique({
      where: { id: stepId },
    })

    if (!currentStep) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 })
    }

    // Create a new step after the current one
    const order = currentStep.order + 1

    const newStep = await prisma.step.create({
      data: {
        flirtId: currentStep.flirtId,
        content: "",
        order: order,
      },
      include: {
        media: true,
        elements: {
          include: {
            textSegments: {
              orderBy: { order: "asc" },
            },
          },
        },
        logics: true,
      },
    })

    // Update order of all subsequent steps
    await prisma.step.updateMany({
      where: {
        flirtId: currentStep.flirtId,
        order: { gte: order },
        id: { not: newStep.id },
      },
      data: {
        order: { increment: 1 },
      },
    })

    const totalSteps = await prisma.step.count({
      where: { flirtId: currentStep.flirtId },
    })

    return NextResponse.json({ step: newStep, totalSteps })
  } catch (err) {
    console.error("POST NEXT STEP ERROR", err)
    return NextResponse.json({ error: "Failed to create next step" }, { status: 500 })
  }
}
