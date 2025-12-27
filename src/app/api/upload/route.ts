import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const file = data.get("file") as File;
  const stepId = data.get("stepId") as string;

  if (!file || !stepId) return NextResponse.json({ error: "Missing file or stepId" }, { status: 400 });

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const filename = `${Date.now()}-${file.name}`;
  const filepath = path.join(uploadsDir, filename);

  const arrayBuffer = await file.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(arrayBuffer));

  // Optional width/height sent by the client (for images)
  const widthStr = data.get("width") as string | null;
  const heightStr = data.get("height") as string | null;
  const width = widthStr ? parseFloat(widthStr) : undefined;
  const height = heightStr ? parseFloat(heightStr) : undefined;

  const createData: Prisma.MediaUncheckedCreateInput = {
    stepId,
    url: `/uploads/${filename}`,
    type: file.type.startsWith("image") ? "IMAGE" : "VIDEO",
  };

  if (width !== undefined) createData.width = width;
  if (height !== undefined) createData.height = height;

  const media = await prisma.media.create({
    data: createData,
  });

  return NextResponse.json({ media });
}
