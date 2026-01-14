import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  stepId: string;
}

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { stepId } = await params;
  const body = await req.json();
  const { type, x = 0, y = 0, z = 1, width, height, text } = body;

  if (!type) return NextResponse.json({ error: "type is required" }, { status: 400 });

  try {
    const element = await prisma.element.create({
      data: { stepId, type, x, y, z, width, height, text },
      include: {
        textSegments: {
          orderBy: { order: 'asc' }
        }
      }
    });
    return NextResponse.json({ ok: true, element });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create element" }, { status: 500 });
  }
}
