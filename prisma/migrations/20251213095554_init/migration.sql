/*
  Warnings:

  - You are about to drop the `Tease` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `teaseId` on the `Step` table. All the data in the column will be lost.
  - Added the required column `flirtId` to the `Step` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Tease";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Flirt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Flirt_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Step" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flirtId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "Step_flirtId_fkey" FOREIGN KEY ("flirtId") REFERENCES "Flirt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Step" ("content", "id", "order") SELECT "content", "id", "order" FROM "Step";
DROP TABLE "Step";
ALTER TABLE "new_Step" RENAME TO "Step";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
