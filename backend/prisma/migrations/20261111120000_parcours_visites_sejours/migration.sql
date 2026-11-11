-- Parcours camion : Visite (passage sur site) + Sejour (temps passé dans chaque zone).
-- Remplace Assignment et les colonnes Camion.status / Camion.parkingSectionId.
-- Les données existantes sont migrées avant suppression des anciennes structures.

-- CreateEnum
CREATE TYPE "Operation" AS ENUM ('CHARGEMENT', 'DECHARGEMENT');

-- CreateEnum
CREATE TYPE "Zone" AS ENUM ('ATTENTE', 'PARKING', 'QUAI');

-- CreateTable
CREATE TABLE "Visite" (
    "id" TEXT NOT NULL,
    "camionId" TEXT NOT NULL,
    "operation" "Operation" NOT NULL,
    "chauffeur" TEXT,
    "notes" TEXT,
    "arrivee" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "depart" TIMESTAMP(3),
    "dureeMinutes" INTEGER,

    CONSTRAINT "Visite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sejour" (
    "id" TEXT NOT NULL,
    "visiteId" TEXT NOT NULL,
    "zone" "Zone" NOT NULL,
    "libelle" TEXT NOT NULL,
    "quaiId" TEXT,
    "parkingSectionId" TEXT,
    "debut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fin" TIMESTAMP(3),
    "dureeMinutes" INTEGER,

    CONSTRAINT "Sejour_pkey" PRIMARY KEY ("id")
);

-- ── Migration des données ────────────────────────────────────────────────
-- 1. Chaque ancienne affectation à quai devient une visite avec un séjour à quai.
INSERT INTO "Visite" ("id", "camionId", "operation", "notes", "arrivee", "depart", "dureeMinutes")
SELECT a."id", a."camionId", 'DECHARGEMENT', a."notes", a."arrivee", a."depart", a."dureeMinutes"
FROM "Assignment" a;

INSERT INTO "Sejour" ("id", "visiteId", "zone", "libelle", "quaiId", "debut", "fin", "dureeMinutes")
SELECT 'mig_q_' || a."id", a."id", 'QUAI', q."nom", a."quaiId", a."arrivee", a."depart", a."dureeMinutes"
FROM "Assignment" a
JOIN "Quai" q ON q."id" = a."quaiId";

-- 2. Les camions au parking (sans affectation à quai en cours) deviennent une visite en cours.
INSERT INTO "Visite" ("id", "camionId", "operation", "arrivee")
SELECT 'mig_v_' || c."id", c."id", 'DECHARGEMENT', c."updatedAt"
FROM "Camion" c
WHERE c."status" = 'PARKING'
  AND NOT EXISTS (SELECT 1 FROM "Assignment" a WHERE a."camionId" = c."id" AND a."depart" IS NULL);

INSERT INTO "Sejour" ("id", "visiteId", "zone", "libelle", "parkingSectionId", "debut")
SELECT 'mig_p_' || c."id",
       'mig_v_' || c."id",
       (CASE WHEN p."id" IS NULL THEN 'ATTENTE' ELSE 'PARKING' END)::"Zone",
       COALESCE(p."nom", 'Accueil'),
       p."id",
       c."updatedAt"
FROM "Camion" c
LEFT JOIN "ParkingSection" p ON p."id" = c."parkingSectionId"
WHERE c."status" = 'PARKING'
  AND NOT EXISTS (SELECT 1 FROM "Assignment" a WHERE a."camionId" = c."id" AND a."depart" IS NULL);

-- ── Suppression des anciennes structures ─────────────────────────────────
-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_camionId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_quaiId_fkey";

-- DropForeignKey
ALTER TABLE "Camion" DROP CONSTRAINT "Camion_parkingSectionId_fkey";

-- AlterTable
ALTER TABLE "Camion" DROP COLUMN "parkingSectionId",
DROP COLUMN "status";

-- DropTable
DROP TABLE "Assignment";

-- CreateIndex
CREATE INDEX "Visite_camionId_idx" ON "Visite"("camionId");

-- CreateIndex
CREATE INDEX "Visite_depart_idx" ON "Visite"("depart");

-- CreateIndex
CREATE INDEX "Sejour_visiteId_idx" ON "Sejour"("visiteId");

-- CreateIndex
CREATE INDEX "Sejour_quaiId_fin_idx" ON "Sejour"("quaiId", "fin");

-- CreateIndex
CREATE INDEX "Sejour_parkingSectionId_fin_idx" ON "Sejour"("parkingSectionId", "fin");

-- AddForeignKey
ALTER TABLE "Visite" ADD CONSTRAINT "Visite_camionId_fkey" FOREIGN KEY ("camionId") REFERENCES "Camion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sejour" ADD CONSTRAINT "Sejour_visiteId_fkey" FOREIGN KEY ("visiteId") REFERENCES "Visite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sejour" ADD CONSTRAINT "Sejour_quaiId_fkey" FOREIGN KEY ("quaiId") REFERENCES "Quai"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sejour" ADD CONSTRAINT "Sejour_parkingSectionId_fkey" FOREIGN KEY ("parkingSectionId") REFERENCES "ParkingSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
