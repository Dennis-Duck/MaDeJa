import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { stepId } = await req.json();

        if (!stepId) {
            return NextResponse.json({ error: "Missing stepId" }, { status: 400 });
        }

        // Remove all media from this step
        await prisma.media.deleteMany({
            where: { stepId },
        });

        const step = await prisma.step.findUnique({
      where: { id: stepId },
    });

        await prisma.step.delete({
            where: { id: stepId },
        });

        await prisma.step.updateMany({
            where: {
                flirtId: step?.flirtId,
                order: { gt: step?.order },
            },
            data: {
                order: { decrement: 1 }, 
            },
        });

        const previousStep = await prisma.step.findFirst({
            where: { flirtId: step?.flirtId, order: (step?.order ?? 0) - 1 },
            include: { media: true },
        });

        return NextResponse.json({ success: true, previousStep });
    } catch (err) {
        console.error("DELETE STEP ERROR", err);
        return NextResponse.json({ error: "Failed to delete step" }, { status: 500 });
    }
}
