import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  stepId: string;
  elementId: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { stepId, elementId } = await params;

  try {
    const element = await prisma.element.findUnique({
      where: { id: elementId },
      include: {
        textSegments: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!element || element.stepId !== stepId) {
      return NextResponse.json({ error: "Element not found" }, { status: 404 });
    }

    return NextResponse.json({ segments: element.textSegments });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch segments" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { stepId, elementId } = await params;
  const body = await req.json();
  const { text } = body;

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  try {
    const element = await prisma.element.findUnique({
      where: { id: elementId },
      include: {
        textSegments: {
          orderBy: { order: 'desc' },
          take: 1
        }
      }
    });

    if (!element || element.stepId !== stepId) {
      return NextResponse.json({ error: "Element not found" }, { status: 404 });
    }

    const nextOrder = element.textSegments.length > 0 
      ? element.textSegments[0].order + 1 
      : 0;

    const segment = await prisma.textSegment.create({
      data: {
        elementId,
        order: nextOrder,
        text: text.trim()
      }
    });

    return NextResponse.json({ ok: true, segment });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create segment" }, { status: 500 });
  }
}
