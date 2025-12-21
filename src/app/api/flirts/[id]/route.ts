import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface RouteContext {
  params: { id: string };
}

export async function DELETE(req: Request, context: RouteContext) {
  // context.params is *direct* beschikbaar, geen await nodig
  const flirtId = context.params.id;

  if (!flirtId) {
    return NextResponse.json({ error: "No flirtId provided" }, { status: 400 });
  }

  try {
    await prisma.media.deleteMany({
      where: { step: { flirtId } },
    });

    await prisma.step.deleteMany({
      where: { flirtId },
    });

    await prisma.flirt.delete({
      where: { id: flirtId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete flirt" }, { status: 500 });
  }
}
