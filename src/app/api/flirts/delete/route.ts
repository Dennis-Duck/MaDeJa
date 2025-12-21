import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { flirtId } = await req.json();

  if (!flirtId) {
    return NextResponse.json({ error: "No flirtId provided" }, { status: 400 });
  }

  try {
    await prisma.media.deleteMany({
      where: {
        step: { flirtId },
      },
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

