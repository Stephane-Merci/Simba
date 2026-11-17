-- Comptes utilisateurs (connexion obligatoire)
CREATE TABLE "Utilisateur" (
    "id" TEXT NOT NULL,
    "identifiant" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "motDePasseModifieLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Utilisateur_identifiant_key" ON "Utilisateur"("identifiant");

-- Compte du responsable. Mot de passe initial communiqué séparément :
-- il doit être changé à la première connexion (menu « Mot de passe »).
INSERT INTO "Utilisateur" ("id", "identifiant", "nom", "motDePasseHash", "updatedAt")
VALUES ('utilisateur_manager', 'manager', 'Responsable', 'scrypt$tAwyhNvwmqDEQpfgCG7ahA==$yB+J9gOJ6r/oPKHNTKYVxZ6CFvOTmjaRyGwnFXP2jIwt1xXaX+fuk3vVpsmuwZVgWROTIWp7jMKyZDtY5XA3uA==', CURRENT_TIMESTAMP);

-- Les quais sont désormais appelés « portes » : renommage des noms par défaut.
UPDATE "Quai" SET "nom" = regexp_replace("nom", '^Quai ', 'Porte ') WHERE "nom" LIKE 'Quai %';
UPDATE "Sejour" SET "libelle" = regexp_replace("libelle", '^Quai ', 'Porte ') WHERE "zone" = 'QUAI' AND "libelle" LIKE 'Quai %';
