import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  stepId: string;
  elementId: string;
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<Params> }
) {
  const { stepId, elementId } = await params;

  if (!stepId || !elementId) {
    return NextResponse.json({ error: "stepId and elementId are required" }, { status: 400 });
  }

  try {
    const element = await prisma.element.findUnique({ where: { id: elementId } });

    if (!element || element.stepId !== stepId) {
      return NextResponse.json({ error: "Element not found for this step" }, { status: 404 });
    }

    await prisma.element.delete({ where: { id: elementId } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete element" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { stepId, elementId } = await params;
  const body = await req.json();

  const { x, y, z, width, height, text } = body;

  try {
    const element = await prisma.element.findUnique({ where: { id: elementId } });

    if (!element || element.stepId !== stepId) {
      return NextResponse.json({ error: "Element not found for this step" }, { status: 404 });
    }

    const safeZ =
      z !== undefined
        ? Math.max(1, z)
        : undefined;

    const updated = await prisma.element.update({
      where: { id: elementId },
      data: {
        ...(x !== undefined && { x }),
        ...(y !== undefined && { y }),
        ...(z !== undefined && { z: safeZ }),
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...(text !== undefined && { text }),
      },
    });

    return NextResponse.json({ ok: true, element: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update element" }, { status: 500 });
  }
}
