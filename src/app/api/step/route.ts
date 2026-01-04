import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { flirtId } = await req.json();

  if (!flirtId) {
    return NextResponse.json({ error: "Missing flirtId" }, { status: 400 });
  }

  const order = await prisma.step.count({
    where: { flirtId },
  }) + 1;

  const step = await prisma.step.create({
    data: {
      flirtId,
      content: "",
      order: order,
    },
    include: { 
      media: true,
      elements: true,
    },
  });

  return NextResponse.json({ step });
}
