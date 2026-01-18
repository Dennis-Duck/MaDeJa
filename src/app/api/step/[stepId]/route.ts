import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteContext {
  params: Promise<{ stepId: string }>
}

// GET - Fetch a specific step
export async function GET(req: Request, context: RouteContext) {
  try {
    const { stepId } = await context.params

    if (!stepId) {
      return NextResponse.json({ error: "Missing stepId" }, { status: 400 })
    }

    const step = await prisma.step.findUnique({
      where: { id: stepId },
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

    if (!step) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 })
    }

    const totalSteps = await prisma.step.count({ where: { flirtId: step.flirtId } })

    return NextResponse.json({ step, totalSteps })
  } catch (err) {
    console.error("GET STEP ERROR", err)
    return NextResponse.json({ error: "Failed to get step" }, { status: 500 })
  }
}

// POST - Create a new step
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { flirtId } = body

    if (!flirtId) {
      return NextResponse.json({ error: "Missing flirtId" }, { status: 400 })
    }

    const order =
      (await prisma.step.count({
        where: { flirtId },
      })) + 1

    const step = await prisma.step.create({
      data: {
        flirtId,
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

    return NextResponse.json({ step })
  } catch (err) {
    console.error("CREATE STEP ERROR", err)
    return NextResponse.json({ error: "Failed to create step" }, { status: 500 })
  }
}

// DELETE - Delete a step
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { stepId } = await context.params

    if (!stepId) {
      return NextResponse.json({ error: "Missing stepId" }, { status: 400 })
    }

    const step = await prisma.step.findUnique({
      where: { id: stepId },
    })

    if (!step) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 })
    }

    // Delete the step (cascading delete will remove media automatically)
    await prisma.step.delete({
      where: { id: stepId },
    })

    // Update order of remaining steps
    await prisma.step.updateMany({
      where: {
        flirtId: step.flirtId,
        order: { gt: step.order },
      },
      data: {
        order: { decrement: 1 },
      },
    })

    const previousStep = await prisma.step.findFirst({
      where: { flirtId: step.flirtId, order: step.order - 1 },
      include: {
        media: true,
        elements: true,
        logics: true,
      },
    })

    return NextResponse.json({ success: true, previousStep })
  } catch (err) {
    console.error("DELETE STEP ERROR", err)
    return NextResponse.json({ error: "Failed to delete step" }, { status: 500 })
  }
}

// PUT - Save entire step state at once
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { stepId } = await context.params

    if (!stepId) {
      return NextResponse.json({ error: "Missing stepId" }, { status: 400 })
    }

    const body = await req.json()
    const { media, elements, logics } = body

    // Use a transaction to ensure all updates succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Update media items
      if (media) {
        // Get existing media IDs
        const existingMedia = await tx.media.findMany({
          where: { stepId },
          select: { id: true },
        })
        const existingMediaIds = new Set(existingMedia.map((m) => m.id))
        const newMediaIds = new Set(media.map((m: any) => m.id))

        // Delete removed media
        const mediaToDelete = [...existingMediaIds].filter((id) => !newMediaIds.has(id))
        if (mediaToDelete.length > 0) {
          await tx.media.deleteMany({
            where: { id: { in: mediaToDelete } },
          })
        }

        // Create new media and update existing
        for (const m of media) {
          if (existingMediaIds.has(m.id)) {
            // Update existing media
            await tx.media.update({
              where: { id: m.id },
              data: {
                x: m.x,
                y: m.y,
                z: m.z,
                width: m.width,
                height: m.height,
              },
            })
          } else {
            // Create new media
            await tx.media.create({
              data: {
                id: m.id,
                stepId,
                url: m.url,
                x: m.x,
                y: m.y,
                z: m.z,
                width: m.width,
                height: m.height,
              },
            })
          }
        }
      }

      // Update elements
      if (elements) {
        const existingElements = await tx.element.findMany({
          where: { stepId },
          select: { id: true },
        })
        const existingElementIds = new Set(existingElements.map((e) => e.id))
        const newElementIds = new Set(elements.map((e: any) => e.id))

        // Delete removed elements
        const elementsToDelete = [...existingElementIds].filter((id) => !newElementIds.has(id))
        if (elementsToDelete.length > 0) {
          await tx.element.deleteMany({
            where: { id: { in: elementsToDelete } },
          })
        }

        // Create new elements and update existing
        for (const el of elements) {
          if (existingElementIds.has(el.id)) {
            // Update existing element
            await tx.element.update({
              where: { id: el.id },
              data: {
                x: el.x,
                y: el.y,
                z: el.z,
                width: el.width,
                height: el.height,
                text: el.text,
                autoAdvance: el.autoAdvance,
                autoAdvanceDelay: el.autoAdvanceDelay,
              },
            })

            // Update text segments if present
            if (el.textSegments) {
              // Delete existing segments
              await tx.textSegment.deleteMany({
                where: { elementId: el.id },
              })

              // Create new segments
              for (let i = 0; i < el.textSegments.length; i++) {
                const segment = el.textSegments[i]
                await tx.textSegment.create({
                  data: {
                    id: segment.id,
                    elementId: el.id,
                    text: segment.text,
                    order: segment.order ?? i,
                  },
                })
              }
            }
          } else {
            // Create new element
            await tx.element.create({
              data: {
                id: el.id,
                stepId,
                type: el.type,
                x: el.x,
                y: el.y,
                z: el.z,
                width: el.width,
                height: el.height,
                text: el.text,
                autoAdvance: el.autoAdvance,
                autoAdvanceDelay: el.autoAdvanceDelay,
              },
            })

            // Create text segments if present
            if (el.textSegments && el.textSegments.length > 0) {
              for (let i = 0; i < el.textSegments.length; i++) {
                const segment = el.textSegments[i]
                await tx.textSegment.create({
                  data: {
                    id: segment.id,
                    elementId: el.id,
                    text: segment.text,
                    order: segment.order ?? i,
                  },
                })
              }
            }
          }
        }
      }

      // Update logics
      if (logics) {
        const existingLogics = await tx.logic.findMany({
          where: { stepId },
          select: { id: true },
        })
        const existingLogicIds = new Set(existingLogics.map((l) => l.id))
        const newLogicIds = new Set(logics.map((l: any) => l.id))

        // Delete removed logics
        const logicsToDelete = [...existingLogicIds].filter((id) => !newLogicIds.has(id))
        if (logicsToDelete.length > 0) {
          await tx.logic.deleteMany({
            where: { id: { in: logicsToDelete } },
          })
        }

        // Create new logics and update existing
        for (const logic of logics) {
          if (existingLogicIds.has(logic.id)) {
            // Update existing logic
            await tx.logic.update({
              where: { id: logic.id },
              data: {
                x: logic.x,
                y: logic.y,
                z: logic.z,
                width: logic.width,
                height: logic.height,
                subtype: logic.subtype,
                config: logic.config,
                parentId: logic.parentId,
                parentType: logic.parentType,
              },
            })
          } else {
            // Create new logic
            await tx.logic.create({
              data: {
                id: logic.id,
                stepId,
                type: logic.type,
                x: logic.x,
                y: logic.y,
                z: logic.z,
                width: logic.width,
                height: logic.height,
                subtype: logic.subtype,
                config: logic.config,
                parentId: logic.parentId,
                parentType: logic.parentType,
              },
            })
          }
        }
      }
    })

    // Fetch and return the updated step
    const updatedStep = await prisma.step.findUnique({
      where: { id: stepId },
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

    return NextResponse.json({ step: updatedStep, success: true })
  } catch (err) {
    console.error("PUT STEP ERROR", err)
    return NextResponse.json({ error: "Failed to save step" }, { status: 500 })
  }
}
