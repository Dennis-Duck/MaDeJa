import Slideshow from "@/components/slideshow/slideshow";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Media as MediaTypeDef } from "@/types/media";

export default async function Page({
  params,
}: {
  params: Promise<{ flirtId: string }>;
}) {
  const { flirtId } = await params;

  const flirt = await prisma.flirt.findUnique({
    where: { id: flirtId },
    include: { steps: { orderBy: { order: "asc" }, include: { media: true } } },
  });

  if (!flirt) notFound();

  // Map Prisma media naar juiste Media type
  const steps: MediaTypeDef[][] = flirt.steps.map((step) =>
    step.media.map((m): MediaTypeDef => ({
      id: m.id,
      url: m.url,
      type: m.type,
      x: m.x ?? 0,
      y: m.y ?? 0,
      z: m.z ?? 0,
      width: m.width ?? 300,
      height: m.height ?? 300,
    }))
  );

  return (
    <div className="w-full h-screen flex justify-center items-center bg-gray-900">
      <Slideshow steps={steps} maxHeight="100vh" />
    </div>
  );
}
