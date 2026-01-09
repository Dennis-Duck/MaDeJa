import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  stepId: string;
  logicId: string;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { stepId, logicId } = await params;
  const body = await req.json();

  const {
    x,
    y,
    z,
    width,
    height,
    subtype,
    parentId,
    parentType,
    config,
  } = body;

  try {
    const logic = await prisma.logic.findUnique({
      where: { id: logicId },
    });

    if (!logic || logic.stepId !== stepId) {
      return NextResponse.json(
        { error: "Logic block not found for this step" },
        { status: 404 }
      );
    }

    const updated = await prisma.logic.update({
      where: { id: logicId },
      data: {
        ...(x !== undefined && { x }),
        ...(y !== undefined && { y }),
        ...(z !== undefined && { z }),
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),

        ...(subtype !== undefined && { subtype }),
        ...(parentId !== undefined && { parentId }),
        ...(parentType !== undefined && { parentType }),

        ...(config !== undefined && { config }),
      },
    });

    return NextResponse.json({ ok: true, logic: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update logic block" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<Params> }
) {
  const { stepId, logicId } = await params;

  if (!stepId || !logicId) {
    return NextResponse.json(
      { error: "stepId and logicId are required" },
      { status: 400 }
    );
  }

  try {
    const logic = await prisma.logic.findUnique({ where: { id: logicId } });

    if (!logic || logic.stepId !== stepId) {
      return NextResponse.json(
        { error: "Logic block not found for this step" },
        { status: 404 }
      );
    }

    await prisma.logic.deleteMany({ where: { parentId: logicId } });

    await prisma.logic.delete({ where: { id: logicId } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete logic block" },
      { status: 500 }
    );
  }
}

