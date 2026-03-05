-- AlterTable
ALTER TABLE "FamilyMember" ADD COLUMN     "treeOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "treePlaced" BOOLEAN NOT NULL DEFAULT false;
