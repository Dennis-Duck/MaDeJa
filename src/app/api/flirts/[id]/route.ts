import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  const { id: flirtId } = await context.params;

  if (!flirtId) {
    return NextResponse.json({ error: "No flirtId provided" }, { status: 400 });
  }

  try {
    const flirt = await prisma.flirt.findUnique({
      where: { id: flirtId },
      include: { steps: true },
    });

    if (!flirt) {
      return NextResponse.json({ error: "Flirt not found" }, { status: 404 });
    }

    return NextResponse.json(flirt);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch flirt" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const { id: flirtId } = await context.params;

  if (!flirtId) {
    return NextResponse.json({ error: "No flirtId provided" }, { status: 400 });
  }

  try {
    // Cascading delete is handled by the database (onDelete: Cascade in schema)
    await prisma.flirt.delete({
      where: { id: flirtId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete flirt" }, { status: 500 });
  }
}
