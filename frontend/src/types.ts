export interface Quai {
    id: string;
    nom: string;
    description?: string;
    ordre: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    assignments: Assignment[];
}

export interface ParkingSection {
    id: string;
    nom: string;
    capacite: number;
    ordre: number;
    createdAt: string;
    updatedAt: string;
    camions: Camion[];
}

export interface Camion {
    id: string;
    matricule: string;
    transporteur?: string;
    type?: string;
    status: 'PARKING' | 'A_QUAI' | 'PARTI';
    parkingSectionId?: string | null;
    parkingSection?: ParkingSection;
    createdAt: string;
    updatedAt: string;
}

export interface Assignment {
    id: string;
    quaiId: string;
    camionId: string;
    arrivee: string;
    depart?: string | null;
    dureeMinutes?: number | null;
    notes?: string | null;
    createdAt: string;
    quai?: Quai;
    camion?: Camion;
}


export interface Stats {
    totalQuais: number;
    occupes: number;
    libres: number;
    totalHistorique: number;
    avgDureeMinutes: number;
}

export function getActiveAssignment(quai: Quai): Assignment | undefined {
    return quai.assignments.find((a) => !a.depart);
}

export function formatDuree(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}min`;
    return `${h}h${m.toString().padStart(2, '0')}`;
}

export function formatDatetime(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function minutesSince(iso: string): number {
    return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

export function formatElapsed(iso: string): string {
    const elapsedMs = Date.now() - new Date(iso).getTime();
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

