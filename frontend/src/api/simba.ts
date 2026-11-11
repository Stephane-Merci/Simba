import api from './client';
import type {
    ArriveeInput,
    CamionRegistre,
    Destination,
    EtatSite,
    Operation,
    Parking,
    Quai,
    Stats,
    Visite,
} from '../types';

/** Appels typés vers le backend SIMBA. */

export const siteApi = {
    etat: () => api.get<EtatSite>('/site').then((r) => r.data),
    stats: (debutJournee: Date) =>
        api.get<Stats>('/stats', { params: { debutJournee: debutJournee.toISOString() } }).then((r) => r.data),
};

export const visitesApi = {
    arrivee: (input: ArriveeInput) => api.post<Visite>('/visites', input).then((r) => r.data),
    deplacer: (id: string, destination: Destination) =>
        api.post<Visite>(`/visites/${id}/deplacer`, destination).then((r) => r.data),
    sortie: (id: string, notes?: string) => api.post<Visite>(`/visites/${id}/sortie`, { notes }).then((r) => r.data),
    annuler: (id: string) => api.delete(`/visites/${id}`),
    modifier: (id: string, data: { operation?: Operation; chauffeur?: string | null; notes?: string | null }) =>
        api.patch<Visite>(`/visites/${id}`, data).then((r) => r.data),
    historique: (params: { q?: string; operation?: Operation; du?: string; au?: string; limit?: number }) =>
        api.get<Visite[]>('/visites', { params }).then((r) => r.data),
};

export const camionsApi = {
    rechercher: (q?: string, limit?: number) =>
        api.get<CamionRegistre[]>('/camions', { params: { q: q || undefined, limit } }).then((r) => r.data),
    creer: (data: { matricule: string; transporteur?: string }) =>
        api.post<CamionRegistre>('/camions', data).then((r) => r.data),
    modifier: (id: string, data: { matricule?: string; transporteur?: string | null }) =>
        api.put<CamionRegistre>(`/camions/${id}`, data).then((r) => r.data),
    supprimer: (id: string) => api.delete(`/camions/${id}`),
};

export const infraApi = {
    creerQuai: (data: { nom: string; description?: string }) => api.post<Quai>('/quais', data).then((r) => r.data),
    modifierQuai: (id: string, data: { nom?: string; description?: string | null }) =>
        api.put<Quai>(`/quais/${id}`, data).then((r) => r.data),
    supprimerQuai: (id: string) => api.delete(`/quais/${id}`),
    ordonnerQuais: (ids: string[]) => api.put('/quais/ordre', { ids }),
    creerParking: (data: { nom: string; capacite: number }) =>
        api.post<Parking>('/parkings', data).then((r) => r.data),
    modifierParking: (id: string, data: { nom?: string; capacite?: number }) =>
        api.put<Parking>(`/parkings/${id}`, data).then((r) => r.data),
    supprimerParking: (id: string) => api.delete(`/parkings/${id}`),
};
