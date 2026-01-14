import Slideshow from "@/components/slideshow/slideshow"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

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
          elements: {
            include: {
              textSegments: {
                orderBy: { order: 'asc' }
              }
            },
          },
          logics: true,
        },
      },
    },
  })

  if (!flirt) notFound()

  return (
    <div className="w-full h-screen flex justify-center items-center bg-[var(--background)]">
      <Slideshow steps={flirt.steps} maxHeight="100vh" />
    </div>
  )
}