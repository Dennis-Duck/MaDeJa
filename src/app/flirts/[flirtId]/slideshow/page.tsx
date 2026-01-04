import Slideshow from "@/components/slideshow/slideshow"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import type { Media } from "@/types/media"
import type { Element } from "@/types/element"

export default async function Page({
  params,
}: {
  params: Promise<{ flirtId: string }>
}) {
  const { flirtId } = await params

  const flirt = await prisma.flirt.findUnique({
    where: { id: flirtId },
    include: {
      steps: {
        orderBy: { order: "asc" },
        include: {
          media: true,
          elements: true, // Voeg elements toe aan de include
        },
      },
    },
  })

  if (!flirt) notFound()

  // Map Prisma data naar juiste types
  const steps = flirt.steps.map((step) => ({
    media: step.media.map((m): Media => ({
      id: m.id,
      url: m.url,
      type: m.type,
      x: m.x ?? 0,
      y: m.y ?? 0,
      z: m.z ?? 0,
      width: m.width ?? 300,
      height: m.height ?? 300,
    })),
    elements: step.elements.map((el): Element => ({
      id: el.id,
      type: el.type,
      text: el.text ?? undefined,
      x: el.x,
      y: el.y,
      z: el.z ?? 0,
      width: el.width ?? undefined,
      height: el.height ?? undefined,
    })),
  }))

  return (
    <div className="w-full h-screen flex justify-center items-center bg-[var(--background)]">
      <Slideshow steps={steps} maxHeight="100vh" />
    </div>
  )
}