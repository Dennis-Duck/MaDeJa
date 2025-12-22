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
    CONSTRAINT "Media_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Media" ("id", "stepId", "type", "url") SELECT "id", "stepId", "type", "url" FROM "Media";
DROP TABLE "Media";
ALTER TABLE "new_Media" RENAME TO "Media";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
