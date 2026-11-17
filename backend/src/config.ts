import 'dotenv/config';
import { randomBytes } from 'crypto';

/**
 * Configuration centralisée, lue une seule fois depuis l'environnement.
 * Voir `.env.example` pour la liste des variables.
 */
const origins = (process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

const authSecret = process.env.AUTH_SECRET?.trim();
if (!authSecret) {
    console.warn(
        "⚠️  AUTH_SECRET non défini : un secret temporaire est utilisé, les sessions seront perdues au redémarrage.",
    );
}

export const config = {
    port: Number(process.env.PORT ?? 5001),
    isProduction: process.env.NODE_ENV === 'production',
    /** Origines autorisées (CORS + Socket.IO). Vide = toutes les origines. */
    corsOrigin: origins.length > 0 ? origins : (true as const),
    /** Dossier du frontend compilé à servir (optionnel, déploiement en un seul service). */
    staticDir: process.env.STATIC_DIR,
    /** Secret de signature des jetons de session (obligatoire en production). */
    authSecret: authSecret || randomBytes(32).toString('hex'),
    /** Durée de validité d'une session. */
    dureeSessionHeures: Number(process.env.SESSION_HOURS ?? 720), // 30 jours
};
