import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

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

  const media = await prisma.media.create({
    data: {
      stepId,
      url: `/uploads/${filename}`,
      type: file.type.startsWith("image") ? "IMAGE" : "VIDEO",
    },
  });

  return NextResponse.json({ media });
}
