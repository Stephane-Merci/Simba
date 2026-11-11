import 'dotenv/config';

/**
 * Configuration centralisée, lue une seule fois depuis l'environnement.
 * Voir `.env.example` pour la liste des variables.
 */
const origins = (process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

export const config = {
    port: Number(process.env.PORT ?? 5001),
    isProduction: process.env.NODE_ENV === 'production',
    /** Origines autorisées (CORS + Socket.IO). Vide = toutes les origines. */
    corsOrigin: origins.length > 0 ? origins : (true as const),
    /** Dossier du frontend compilé à servir (optionnel, déploiement en un seul service). */
    staticDir: process.env.STATIC_DIR,
};
