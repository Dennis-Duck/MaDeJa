-- CreateTable
CREATE TABLE "Logic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stepId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subtype" TEXT,
    "config" TEXT,
    "parentId" TEXT,
    "parentType" TEXT,
    "x" REAL NOT NULL DEFAULT 0,
    "y" REAL NOT NULL DEFAULT 0,
    "z" INTEGER NOT NULL DEFAULT 0,
    "width" REAL,
    "height" REAL,
    CONSTRAINT "Logic_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
