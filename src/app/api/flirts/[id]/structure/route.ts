import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteContext {
  params: Promise<{ id: string }>
}

type SaveStructurePayload = {
  stepOrder: string[]
  deletedStepIds: string[]
  newStepIds: string[]
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id: flirtId } = await context.params

    if (!flirtId) {
      return NextResponse.json({ error: "Missing flirtId" }, { status: 400 })
    }

    const body = (await req.json()) as SaveStructurePayload
    const { stepOrder, deletedStepIds, newStepIds } = body

    if (!Array.isArray(stepOrder)) {
      return NextResponse.json({ error: "Invalid stepOrder" }, { status: 400 })
    }

    // Ensure uniqueness and basic sanity
    const uniqueOrder = Array.from(new Set(stepOrder))

    await prisma.$transaction(async tx => {
      // 1) Delete steps that are marked as deleted
      if (deletedStepIds && deletedStepIds.length > 0) {
        await tx.step.deleteMany({
          where: {
            flirtId,
            id: { in: deletedStepIds },
          },
        })
      }

      // 2) Ensure all ids in stepOrder exist as steps for this flirt
      if (newStepIds && newStepIds.length > 0) {
        const existing = await tx.step.findMany({
          where: {
            flirtId,
            id: { in: newStepIds },
          },
          select: { id: true },
        })

        const existingIds = new Set(existing.map(s => s.id))
        const toCreate = newStepIds.filter(id => !existingIds.has(id))

        for (const id of toCreate) {
          await tx.step.create({
            data: {
              id,
              flirtId,
              content: "",
              order: 0, // will be normalised in step 3
            },
          })
        }
      }

      // 3) Normalise order for all steps in stepOrder
      for (let index = 0; index < uniqueOrder.length; index++) {
        const id = uniqueOrder[index]
        await tx.step.updateMany({
          where: { id, flirtId },
          data: { order: index + 1 },
        })
      }
    })

    // Return the canonical order from DB
    const updatedSteps = await prisma.step.findMany({
      where: { flirtId },
      orderBy: { order: "asc" },
      select: { id: true, order: true },
    })

    return NextResponse.json({
      success: true,
      updatedSteps,
    })
  } catch (err) {
    console.error("SAVE FLIRT STRUCTURE ERROR", err)
    return NextResponse.json({ error: "Failed to save flirt structure" }, { status: 500 })
  }
}

