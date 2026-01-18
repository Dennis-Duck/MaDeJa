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

    const previousStep = await prisma.step.findFirst({
      where: {
        flirtId: currentStep.flirtId,
        order: currentStep.order - 1,
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

    if (!previousStep) {
      return NextResponse.json({ error: "No previous step" }, { status: 404 })
    }

    return NextResponse.json({ step: previousStep })
  } catch (err) {
    console.error("GET PREVIOUS STEP ERROR", err)
    return NextResponse.json({ error: "Failed to get previous step" }, { status: 500 })
  }
}

export async function POST() {
  // For POST on /previous, we don't create new steps
  // This endpoint is only for navigation
  return NextResponse.json({ error: "POST not allowed on /previous" }, { status: 405 })
}
