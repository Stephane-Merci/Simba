/*
  Warnings:

  - You are about to drop the column `camionNumero` on the `Assignment` table. All the data in the column will be lost.
  - Added the required column `camionId` to the `Assignment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "camionNumero",
ADD COLUMN     "camionId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ParkingSection" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParkingSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Camion" (
    "id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "transporteur" TEXT,
    "type" TEXT DEFAULT 'Standard',
    "status" TEXT NOT NULL DEFAULT 'PARTI',
    "parkingSectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Camion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Camion_matricule_key" ON "Camion"("matricule");

-- AddForeignKey
ALTER TABLE "Camion" ADD CONSTRAINT "Camion_parkingSectionId_fkey" FOREIGN KEY ("parkingSectionId") REFERENCES "ParkingSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_camionId_fkey" FOREIGN KEY ("camionId") REFERENCES "Camion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
