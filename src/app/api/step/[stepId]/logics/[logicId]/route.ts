import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  stepId: string;
  logicId: string;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { stepId, logicId } = await params;
  const body = await req.json();
  const { x, y, z, width, height, config } = body;

  try {
    const logic = await prisma.logic.findUnique({ where: { id: logicId } })
      || await prisma.logic.findUnique({ where: { id: logicId } })
      || await prisma.logic.findUnique({ where: { id: logicId } })
      || await prisma.logic.findUnique({ where: { id: logicId } });

    if (!logic || logic.stepId !== stepId) {
      return NextResponse.json({ error: "Logic block not found for this step" }, { status: 404 });
    }

    const safeZ = z !== undefined ? Math.max(1, z) : undefined;

    let updated;
    switch (logic.type) {
      case "TRIGGER":
        updated = await prisma.logic.update({
          where: { id: logicId },
          data: { ...(x !== undefined && { x }), ...(y !== undefined && { y }), ...(z !== undefined && { z: safeZ }), ...(width !== undefined && { width }), ...(height !== undefined && { height }), ...(config !== undefined && { config }) },
        });
        break;
      case "JUMP":
        updated = await prisma.logic.update({
          where: { id: logicId },
          data: { ...(x !== undefined && { x }), ...(y !== undefined && { y }), ...(z !== undefined && { z: safeZ }), ...(width !== undefined && { width }), ...(height !== undefined && { height }), ...(config !== undefined && { config }) },
        });
        break;
      case "CHECK":
        updated = await prisma.logic.update({
          where: { id: logicId },
          data: { ...(x !== undefined && { x }), ...(y !== undefined && { y }), ...(z !== undefined && { z: safeZ }), ...(width !== undefined && { width }), ...(height !== undefined && { height }), ...(config !== undefined && { config }) },
        });
        break;
      case "ACTION":
        updated = await prisma.logic.update({
          where: { id: logicId },
          data: { ...(x !== undefined && { x }), ...(y !== undefined && { y }), ...(z !== undefined && { z: safeZ }), ...(width !== undefined && { width }), ...(height !== undefined && { height }), ...(config !== undefined && { config }) },
        });
        break;
      default:
        return NextResponse.json({ error: "Unknown logic type" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, logic: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update logic block" }, { status: 500 });
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

    // 1️⃣ Eerst alle child-logics verwijderen (indirecte afhankelijkheden)
    await prisma.logic.deleteMany({ where: { parentId: logicId } });

    // 2️⃣ Dan de parent zelf verwijderen
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

