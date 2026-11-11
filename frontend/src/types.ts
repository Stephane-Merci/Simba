export type Operation = 'CHARGEMENT' | 'DECHARGEMENT';
export type Zone = 'ATTENTE' | 'PARKING' | 'QUAI';

export interface Quai {
    id: string;
    nom: string;
    description: string | null;
    ordre: number;
}

export interface Parking {
    id: string;
    nom: string;
    capacite: number;
    ordre: number;
}

export interface Camion {
    id: string;
    matricule: string;
    transporteur: string | null;
    type: string | null;
    createdAt: string;
    updatedAt: string;
}

/** Temps passé dans une zone (accueil, parking ou quai). */
export interface Sejour {
    id: string;
    visiteId: string;
    zone: Zone;
    libelle: string;
    quaiId: string | null;
    parkingSectionId: string | null;
    debut: string;
    fin: string | null;
    dureeMinutes: number | null;
}

/** Un passage sur site, de l'arrivée à l'accueil jusqu'à la sortie. */
export interface Visite {
    id: string;
    camionId: string;
    operation: Operation;
    chauffeur: string | null;
    notes: string | null;
    arrivee: string;
    depart: string | null;
    dureeMinutes: number | null;
    camion: Camion;
    sejours: Sejour[];
}

export interface EtatSite {
    quais: Quai[];
    parkings: Parking[];
    visites: Visite[];
    serverTime: string;
}

export interface Stats {
    sortiesDuJour: number;
    arriveesDuJour: number;
    visites30j: number;
    moyenneVisiteMinutes: number;
    moyenneParZoneMinutes: Record<Zone, number>;
}

export interface CamionRegistre extends Camion {
    _count: { visites: number };
    visites: (Omit<Visite, 'camion'> & { sejours: Sejour[] })[];
}

export type Destination =
    | { zone: 'ATTENTE' }
    | { zone: 'QUAI'; quaiId: string }
    | { zone: 'PARKING'; parkingSectionId: string };

export interface ArriveeInput {
    matricule: string;
    transporteur?: string;
    chauffeur?: string;
    operation: Operation;
    notes?: string;
    destination?: Destination;
}
