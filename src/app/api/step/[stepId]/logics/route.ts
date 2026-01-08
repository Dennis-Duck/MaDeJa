import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  stepId: string;
}

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { stepId } = await params;
  const body = await req.json();
  const { type, x = 0, y = 0, z = 1, width, height, config } = body;

  if (!type) return NextResponse.json({ error: "type is required" }, { status: 400 });

  try {
    let logic;
    switch (type) {
      case "TRIGGER":
        logic = await prisma.logic.create({ data: { stepId, type: "TRIGGER", x, y, z, width, height, config } });
        break;
      case "JUMP":
        logic = await prisma.logic.create({ data: { stepId, type: "JUMP", x, y, z, width, height, config } });
        break;
      case "CHECK":
        logic = await prisma.logic.create({ data: { stepId, type: "CHECK", x, y, z, width, height, config } });
        break;
      case "ACTION":
        logic = await prisma.logic.create({ data: { stepId, type: "ACTION", x, y, z, width, height, config } });
        break;
      default:
        return NextResponse.json({ error: "Unknown logic type" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, logic });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create logic block" }, { status: 500 });
  }
}
