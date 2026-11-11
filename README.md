# SIMBA — Gestion du site (accueil camions, quais, parkings)

Application utilisée à l'accueil d'un entrepôt pour suivre chaque camion, de son arrivée à sa sortie.

## Parcours d'un camion

1. **Arrivée** : le chauffeur se présente à l'accueil et donne son matricule et le motif de sa venue
   (**déchargement** : il livre ; **chargement** : il vient chercher de la marchandise).
   Le gestionnaire clique sur **Nouvelle arrivée** (raccourci `N`). Si le camion est déjà venu, il est
   retrouvé automatiquement, quel que soit le format de saisie (`AB123CD`, `ab 123 cd` → `AB-123-CD`).
2. **Placement** : le camion est envoyé dans la file d'attente, à un quai libre ou dans un parking.
   Il peut ensuite être déplacé librement (glisser-déposer sur le tableau de bord, ou depuis sa fiche).
3. **Suivi du temps** : chaque passage dans une zone est enregistré (début, fin, durée). Les attentes
   anormalement longues sont signalées en orange puis en rouge.
4. **Sortie** : quand le camion repart, le gestionnaire le glisse sur **Sortie du site** (ou clique sur
   *Enregistrer la sortie*), vérifie le récapitulatif et valide.

Tous les postes ouverts sont synchronisés en temps réel (Socket.IO).

## Architecture

```
backend/   API Express + Prisma (PostgreSQL) + Socket.IO
  prisma/schema.prisma      Camion ─< Visite ─< Sejour  (+ Quai, ParkingSection)
  src/config.ts             configuration (variables d'environnement)
  src/lib/                  prisma, erreurs HTTP, diffusion temps réel
  src/domain/regles.ts      règles pures (normalisation des matricules, durées)
  src/services/             logique métier transactionnelle (arrivée, déplacement, sortie…)
  src/routes/               contrôleurs HTTP minces + validation (zod)
frontend/  React + Vite + Tailwind + Zustand
  src/api/                  appels typés vers l'API
  src/store/                état du site (optimiste) et de l'interface
  src/lib/parcours.ts       règles d'affichage partagées (zones, seuils, durées)
  src/components/           site (quais, parkings, accueil), parcours (modales, fiche), ui
  src/pages/                Tableau de bord, Historique, Véhicules, Configuration
```

- **Visite** = un passage sur site (arrivée → sortie). **Séjour** = temps passé dans une zone.
  Un déplacement ferme le séjour en cours et en ouvre un nouveau : le temps par zone est toujours exact.
- Les opérations critiques s'exécutent en transaction sérialisable : deux postes ne peuvent pas
  attribuer le même quai ni la dernière place d'un parking au même moment.

### API principale

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/site` | Quais, parkings et camions présents |
| GET | `/api/stats` | Indicateurs du jour et moyennes 30 jours |
| POST | `/api/visites` | Arrivée (crée ou retrouve le camion) |
| POST | `/api/visites/:id/deplacer` | Déplacement (`ATTENTE` / `QUAI` / `PARKING`) |
| POST | `/api/visites/:id/sortie` | Sortie du site |
| DELETE | `/api/visites/:id` | Annuler une arrivée saisie par erreur |
| GET | `/api/visites` | Historique (filtres `q`, `operation`, `du`, `au`) |
| GET/POST/PUT/DELETE | `/api/camions`, `/api/quais`, `/api/parkings` | Registre et configuration |

## Développement

```bash
# Backend (PostgreSQL requis)
cd backend
cp .env.example .env          # renseigner DATABASE_URL
npm install
npx prisma migrate deploy
npm run db:seed               # facultatif : 8 quais + 2 parkings si la base est vide
npm run dev                   # http://localhost:5001

# Frontend
cd frontend
npm install
npm run dev                   # http://localhost:3001 (proxy /api → localhost:5001)
```

## Déploiement

### Docker (tout-en-un)

```bash
docker compose up -d --build   # http://localhost:8080
```

Variables facultatives : `POSTGRES_PASSWORD`, `SIMBA_PORT`.

### Render en un clic (Blueprint)

Le fichier `render.yaml` crée la base PostgreSQL et un service web unique (l'API sert aussi
l'interface). Dashboard Render → **New → Blueprint** → choisir ce dépôt → **Apply**.

### Services séparés (ex. Render)

- **Backend** — build : `npm install && npm run build` ; démarrage : `npm start`
  (applique automatiquement les migrations). Variables : `DATABASE_URL`, `CORS_ORIGINS`.
- **Frontend** (site statique) — build : `npm install && npm run build`, dossier `dist`.
  Variable : `VITE_API_URL=https://<backend>/api`. Le fichier `public/_redirects` gère le routage.

### Migration depuis la version 1

La migration `20261111120000_parcours_visites_sejours` convertit automatiquement les anciennes
affectations à quai en visites, et les camions au parking en visites en cours.
L'opération de ces anciennes données est inconnue : elles sont marquées « Déchargement ».
**Faites une sauvegarde de la base avant de déployer.**
