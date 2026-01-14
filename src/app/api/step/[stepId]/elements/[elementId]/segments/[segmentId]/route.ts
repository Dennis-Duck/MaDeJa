import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface SegmentParams {
  stepId: string;
  elementId: string;
  segmentId: string;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<SegmentParams> }
) {
  const { stepId, elementId, segmentId } = await params;
  const body = await req.json();
  const { text, order } = body;

  try {
    const segment = await prisma.textSegment.findUnique({
      where: { id: segmentId },
      include: { element: true }
    });

    if (!segment || segment.element.stepId !== stepId || segment.elementId !== elementId) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    const updated = await prisma.textSegment.update({
      where: { id: segmentId },
      data: {
        ...(text !== undefined && { text: text.trim() }),
        ...(order !== undefined && { order })
      }
    });

    return NextResponse.json({ ok: true, segment: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update segment" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<SegmentParams> }
) {
  const { stepId, elementId, segmentId } = await params;

  try {
    const segment = await prisma.textSegment.findUnique({
      where: { id: segmentId },
      include: { element: true }
    });

    if (!segment || segment.element.stepId !== stepId || segment.elementId !== elementId) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    await prisma.textSegment.delete({
      where: { id: segmentId }
    });

    const remaining = await prisma.textSegment.findMany({
      where: { elementId },
      orderBy: { order: 'asc' }
    });

    for (let idx = 0; idx < remaining.length; idx++) {
      await prisma.textSegment.update({
        where: { id: remaining[idx].id },
        data: { order: idx }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete segment" }, { status: 500 });
  }
}
