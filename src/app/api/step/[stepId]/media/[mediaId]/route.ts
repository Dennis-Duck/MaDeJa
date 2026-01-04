import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma";

interface Params {
  stepId: string;
  mediaId: string;
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<Params> }
) {
  const { stepId, mediaId } = await params;

  if (!stepId || !mediaId) {
    return NextResponse.json(
      { error: "stepId and mediaId are required" },
      { status: 400 }
    );
  }

  try {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media || media.stepId !== stepId) {
      return NextResponse.json(
        { error: "Media not found for this step" },
        { status: 404 }
      );
    }

    await prisma.media.delete({
      where: { id: mediaId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string; mediaId: string }> },
) {
  const { stepId, mediaId } = await params
  const body = await request.json()

  const { x, y, z, width, height } = body

  try {
    const updated = await prisma.media.update({
      where: { id: mediaId },
      data: {
        ...(x !== undefined && { x }),
        ...(y !== undefined && { y }),
        ...(z !== undefined && { z }),
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
      },
    })

    console.log("Updated media:", updated)
    return NextResponse.json({ ok: true, media: updated })
  } catch (err) {
    console.error("Failed to update media:", err)
    return NextResponse.json({ error: "Failed to update media" }, { status: 500 })
  }
}
