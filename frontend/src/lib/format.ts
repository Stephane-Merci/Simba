/** Formats d'affichage (français). */

const HEURE = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const DATE_COURTE = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' });
const DATE_HEURE = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

export const heure = (iso: string | Date) => HEURE.format(new Date(iso));
export const dateHeure = (iso: string | Date) => DATE_HEURE.format(new Date(iso));

/** « 14:05 » aujourd'hui, sinon « 12 nov. 14:05 ». */
export function quand(iso: string | Date, maintenant = Date.now()): string {
    const d = new Date(iso);
    const memeJour = new Date(maintenant).toDateString() === d.toDateString();
    return memeJour ? HEURE.format(d) : `${DATE_COURTE.format(d)} ${HEURE.format(d)}`;
}

/** Durée lisible : « 45 s », « 12 min », « 2 h 05 », « 3 j 4 h ». */
export function duree(ms: number): string {
    const s = Math.max(0, Math.floor(ms / 1000));
    if (s < 60) return `${s} s`;
    const min = Math.floor(s / 60);
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} h ${String(min % 60).padStart(2, '0')}`;
    return `${Math.floor(h / 24)} j ${h % 24} h`;
}

export const dureeMinutes = (minutes: number) => duree(minutes * 60000);

/** Chronomètre : « 01:02:03 ». */
export function chrono(ms: number): string {
    const s = Math.max(0, Math.floor(ms / 1000));
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

export const pluriel = (n: number, mot: string, forme = `${mot}s`) => `${n} ${n > 1 ? forme : mot}`;

export function cleMatricule(saisie: string): string {
    return saisie.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
