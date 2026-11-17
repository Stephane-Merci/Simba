import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { HttpError } from '../lib/http';
import { creerJeton, hacherMotDePasse, lireJeton, verifierMotDePasse } from '../lib/auth';

/** Connexion (identifiant + mot de passe), session par jeton signé. Pas d'inscription. */

export interface UtilisateurPublic {
    id: string;
    identifiant: string;
    nom: string;
}

const nonAutorise = (message = 'Session expirée. Veuillez vous reconnecter.') => new HttpError(401, message);

const versPublic = (u: UtilisateurPublic): UtilisateurPublic => ({ id: u.id, identifiant: u.identifiant, nom: u.nom });

// ── Limitation des tentatives (par adresse IP, en mémoire) ───────────────
const FENETRE_MS = 15 * 60 * 1000;
const MAX_ECHECS = 10;
const echecs = new Map<string, { nombre: number; depuis: number }>();

function verifierLimite(ip: string) {
    const e = echecs.get(ip);
    if (e && Date.now() - e.depuis < FENETRE_MS && e.nombre >= MAX_ECHECS) {
        throw new HttpError(429, 'Trop de tentatives. Réessayez dans quelques minutes.');
    }
}

function noterEchec(ip: string) {
    const e = echecs.get(ip);
    if (!e || Date.now() - e.depuis >= FENETRE_MS) echecs.set(ip, { nombre: 1, depuis: Date.now() });
    else e.nombre++;
}

// ── Cas d'usage ──────────────────────────────────────────────────────────

export async function connexion(identifiant: string, motDePasse: string, ip: string) {
    verifierLimite(ip);
    const u = await prisma.utilisateur.findUnique({ where: { identifiant: identifiant.trim().toLowerCase() } });
    if (!u || !(await verifierMotDePasse(motDePasse, u.motDePasseHash))) {
        noterEchec(ip);
        throw nonAutorise('Identifiant ou mot de passe incorrect.');
    }
    echecs.delete(ip);
    return { jeton: creerJeton(u.id), utilisateur: versPublic(u) };
}

/** Retrouve l'utilisateur d'un jeton, ou `null` si le jeton est invalide ou révoqué. */
export async function utilisateurDuJeton(jeton: string | undefined): Promise<UtilisateurPublic | null> {
    const contenu = jeton ? lireJeton(jeton) : null;
    if (!contenu) return null;
    const u = await prisma.utilisateur.findUnique({ where: { id: contenu.sub } });
    // Un changement de mot de passe révoque les sessions ouvertes avant lui.
    if (!u || contenu.iat < Math.floor(u.motDePasseModifieLe.getTime() / 1000)) return null;
    return versPublic(u);
}

export async function changerMotDePasse(utilisateurId: string, actuel: string, nouveau: string) {
    const u = await prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
    if (!u) throw nonAutorise();
    if (!(await verifierMotDePasse(actuel, u.motDePasseHash))) {
        throw new HttpError(400, 'Le mot de passe actuel est incorrect.');
    }
    if (actuel === nouveau) throw new HttpError(400, 'Le nouveau mot de passe doit être différent de l’actuel.');
    // Arrondi à la seconde inférieure : le nouveau jeton (iat en secondes) reste valide.
    const maintenant = new Date(Math.floor(Date.now() / 1000) * 1000);
    await prisma.utilisateur.update({
        where: { id: u.id },
        data: { motDePasseHash: await hacherMotDePasse(nouveau), motDePasseModifieLe: maintenant },
    });
    // Nouvelle session pour ce poste ; les autres sessions sont déconnectées.
    return { jeton: creerJeton(u.id) };
}

// ── Middleware ───────────────────────────────────────────────────────────

declare module 'express-serve-static-core' {
    interface Request {
        utilisateur?: UtilisateurPublic;
    }
}

export const jetonDeLaRequete = (entete: string | undefined) =>
    entete?.startsWith('Bearer ') ? entete.slice(7).trim() : undefined;

/** Bloque toute requête sans session valide (401). */
export const exigerConnexion: RequestHandler = (req, _res, next) => {
    utilisateurDuJeton(jetonDeLaRequete(req.headers.authorization))
        .then((u) => {
            if (!u) return next(nonAutorise());
            req.utilisateur = u;
            next();
        })
        .catch(next);
};
