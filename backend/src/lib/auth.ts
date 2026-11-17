import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { config } from '../config';

/**
 * Outils d'authentification, sans dépendance externe :
 *   - mots de passe hachés avec scrypt (sel aléatoire par utilisateur) ;
 *   - jetons de session signés HMAC-SHA256 (format compact type JWT).
 */
const scrypt = promisify(scryptCb) as (pwd: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const LONGUEUR_CLE = 64;

/** Format stocké : `scrypt$<sel base64>$<empreinte base64>`. */
export async function hacherMotDePasse(motDePasse: string): Promise<string> {
    const sel = randomBytes(16);
    const empreinte = await scrypt(motDePasse, sel, LONGUEUR_CLE);
    return `scrypt$${sel.toString('base64')}$${empreinte.toString('base64')}`;
}

export async function verifierMotDePasse(motDePasse: string, stocke: string): Promise<boolean> {
    const [algo, selB64, empreinteB64] = stocke.split('$');
    if (algo !== 'scrypt' || !selB64 || !empreinteB64) return false;
    const attendue = Buffer.from(empreinteB64, 'base64');
    const calculee = await scrypt(motDePasse, Buffer.from(selB64, 'base64'), attendue.length);
    return attendue.length === calculee.length && timingSafeEqual(attendue, calculee);
}

// ── Jetons de session ────────────────────────────────────────────────────

export interface ContenuJeton {
    /** Identifiant de l'utilisateur. */
    sub: string;
    /** Émis le (secondes depuis epoch). */
    iat: number;
    /** Expire le (secondes depuis epoch). */
    exp: number;
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString('base64url');
const signer = (donnees: string) => createHmac('sha256', config.authSecret).update(donnees).digest('base64url');

export function creerJeton(utilisateurId: string): string {
    const maintenant = Math.floor(Date.now() / 1000);
    const contenu: ContenuJeton = { sub: utilisateurId, iat: maintenant, exp: maintenant + config.dureeSessionHeures * 3600 };
    const corps = `${b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64url(JSON.stringify(contenu))}`;
    return `${corps}.${signer(corps)}`;
}

/** Renvoie le contenu du jeton s'il est authentique et non expiré, sinon `null`. */
export function lireJeton(jeton: string): ContenuJeton | null {
    const [entete, charge, signature] = jeton.split('.');
    if (!entete || !charge || !signature) return null;
    const attendue = Buffer.from(signer(`${entete}.${charge}`));
    const recue = Buffer.from(signature);
    if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue)) return null;
    try {
        const contenu = JSON.parse(Buffer.from(charge, 'base64url').toString('utf8')) as ContenuJeton;
        if (typeof contenu.sub !== 'string' || typeof contenu.exp !== 'number') return null;
        if (contenu.exp < Date.now() / 1000) return null;
        return contenu;
    } catch {
        return null;
    }
}
