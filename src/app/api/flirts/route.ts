import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { title, description } = await req.json();

    const author = await prisma.user.upsert({
      where: { email: "test@example.com" },
      update: {},
      create: { email: "test@example.com" },
    });

    const flirt = await prisma.flirt.create({
      data: {
        title,
        description,
        author: { connect: { id: author.id } },
        steps: {
          create: [
            { content: "", order: 1 }
          ],
        },
      },
      include: { steps: true },
    });

    return NextResponse.json({
      flirtId: flirt.id,
      firstStepId: flirt.steps[0].id,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create flirt" }, { status: 500 });
  }
}
