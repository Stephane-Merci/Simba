import type { Destination, EtatSite, Operation, Sejour, Visite, Zone } from '../types';

/** Règles d'affichage du parcours camion (partagées par tous les écrans). */

export const OPERATIONS: Record<Operation, { libelle: string; court: string; aide: string; couleur: string; douce: string }> = {
    DECHARGEMENT: {
        libelle: 'Déchargement',
        court: 'Livraison',
        aide: 'Le camion livre de la marchandise',
        couleur: 'var(--dech)',
        douce: 'var(--dech-soft)',
    },
    CHARGEMENT: {
        libelle: 'Chargement',
        court: 'Enlèvement',
        aide: 'Le camion vient récupérer de la marchandise',
        couleur: 'var(--charg)',
        douce: 'var(--charg-soft)',
    },
};

export const ZONES: Record<Zone, { libelle: string; couleur: string }> = {
    ATTENTE: { libelle: 'Accueil', couleur: 'var(--attente)' },
    PARKING: { libelle: 'Parking', couleur: 'var(--parking)' },
    QUAI: { libelle: 'Quai', couleur: 'var(--quai)' },
};

/** Seuils (en minutes) à partir desquels un séjour est signalé : [attention, alerte]. */
export const SEUILS: Record<Zone, [number, number]> = {
    ATTENTE: [20, 45],
    PARKING: [180, 480],
    QUAI: [90, 180],
};

export type Niveau = 'ok' | 'attention' | 'alerte';

export function niveauSejour(sejour: Sejour | undefined, maintenant: number): Niveau {
    if (!sejour) return 'ok';
    const minutes = (maintenant - new Date(sejour.debut).getTime()) / 60000;
    const [attention, alerte] = SEUILS[sejour.zone];
    return minutes >= alerte ? 'alerte' : minutes >= attention ? 'attention' : 'ok';
}

export const sejourActuel = (v: Visite): Sejour | undefined => v.sejours.find((s) => !s.fin);

// ── Identifiants des zones de dépôt (glisser-déposer) ─────────────────────
export const ID_ATTENTE = 'attente';
export const ID_SORTIE = 'sortie';
export const idQuai = (id: string) => `quai:${id}`;
export const idParking = (id: string) => `parking:${id}`;

export function emplacementDe(v: Visite): string {
    const s = sejourActuel(v);
    if (s?.zone === 'QUAI' && s.quaiId) return idQuai(s.quaiId);
    if (s?.zone === 'PARKING' && s.parkingSectionId) return idParking(s.parkingSectionId);
    return ID_ATTENTE;
}

export function destinationDepuisId(id: string): Destination | null {
    if (id === ID_ATTENTE) return { zone: 'ATTENTE' };
    if (id.startsWith('quai:')) return { zone: 'QUAI', quaiId: id.slice(5) };
    if (id.startsWith('parking:')) return { zone: 'PARKING', parkingSectionId: id.slice(8) };
    return null;
}

export function libelleDestination(etat: EtatSite, d: Destination): string {
    if (d.zone === 'QUAI') return etat.quais.find((q) => q.id === d.quaiId)?.nom ?? 'Quai';
    if (d.zone === 'PARKING') return etat.parkings.find((p) => p.id === d.parkingSectionId)?.nom ?? 'Parking';
    return 'Accueil';
}

/** Répartition du temps passé par zone (séjours en cours compris). */
export function tempsParZone(sejours: Sejour[], maintenant: number): Record<Zone, number> {
    const total: Record<Zone, number> = { ATTENTE: 0, PARKING: 0, QUAI: 0 };
    for (const s of sejours) {
        const fin = s.fin ? new Date(s.fin).getTime() : maintenant;
        total[s.zone] += Math.max(0, fin - new Date(s.debut).getTime());
    }
    return total;
}

export const dureeSejour = (s: Sejour, maintenant: number) =>
    (s.fin ? new Date(s.fin).getTime() : maintenant) - new Date(s.debut).getTime();

export const dureeVisite = (v: Visite, maintenant: number) =>
    (v.depart ? new Date(v.depart).getTime() : maintenant) - new Date(v.arrivee).getTime();

/** Occupation actuelle : quel camion est à quel quai, combien par parking. */
export function occupation(etat: EtatSite) {
    const parQuai = new Map<string, Visite>();
    const parParking = new Map<string, Visite[]>();
    const attente: Visite[] = [];
    for (const v of etat.visites) {
        const s = sejourActuel(v);
        if (s?.zone === 'QUAI' && s.quaiId) parQuai.set(s.quaiId, v);
        else if (s?.zone === 'PARKING' && s.parkingSectionId) {
            const liste = parParking.get(s.parkingSectionId) ?? [];
            liste.push(v);
            parParking.set(s.parkingSectionId, liste);
        } else attente.push(v);
    }
    return { parQuai, parParking, attente };
}
