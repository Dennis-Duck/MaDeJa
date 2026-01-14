-- AlterTable
ALTER TABLE "Element" ADD COLUMN "autoAdvance" BOOLEAN DEFAULT false;
ALTER TABLE "Element" ADD COLUMN "autoAdvanceDelay" INTEGER;

-- CreateTable
CREATE TABLE "TextSegment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "elementId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "text" TEXT NOT NULL,
    CONSTRAINT "TextSegment_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "Element" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TextSegment_elementId_idx" ON "TextSegment"("elementId");

-- CreateIndex
CREATE UNIQUE INDEX "TextSegment_elementId_order_key" ON "TextSegment"("elementId", "order");
