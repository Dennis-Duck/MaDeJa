-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stepId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "x" REAL NOT NULL DEFAULT 0,
    "y" REAL NOT NULL DEFAULT 0,
    "z" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Media_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Media" ("id", "stepId", "type", "url", "x", "y", "z") SELECT "id", "stepId", "type", "url", "x", "y", "z" FROM "Media";
DROP TABLE "Media";
ALTER TABLE "new_Media" RENAME TO "Media";
CREATE TABLE "new_Step" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flirtId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "Step_flirtId_fkey" FOREIGN KEY ("flirtId") REFERENCES "Flirt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Step" ("content", "flirtId", "id", "order") SELECT "content", "flirtId", "id", "order" FROM "Step";
DROP TABLE "Step";
ALTER TABLE "new_Step" RENAME TO "Step";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
