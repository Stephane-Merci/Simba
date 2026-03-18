import { create } from 'zustand';
import apiClient from '../api/client';
import { Quai, Assignment, Stats, Camion } from '../types';

interface SimbaStore {
    quais: Quai[];
    camions: Camion[];
    historique: Assignment[];
    stats: Stats | null;
    loading: boolean;
    error: string;

    fetchQuais: () => Promise<void>;
    fetchCamions: (status?: string) => Promise<void>;
    fetchHistorique: (limit?: number) => Promise<void>;
    fetchStats: () => Promise<void>;
    assignerCamion: (quaiId: string, camionId: string, notes?: string) => Promise<void>;
    libererQuai: (assignmentId: string) => Promise<void>;
    createQuai: (nom: string, description?: string) => Promise<void>;
    updateQuai: (id: string, nom: string, description?: string) => Promise<void>;
    deleteQuai: (id: string) => Promise<void>;
    createCamion: (matricule: string, transporteur?: string) => Promise<void>;
    updateCamion: (id: string, matricule: string, transporteur?: string) => Promise<void>;
    deleteCamion: (id: string) => Promise<void>;
}

export const useStore = create<SimbaStore>((set, get) => ({
    quais: [],
    camions: [],
    historique: [],
    stats: null,
    loading: false,
    error: '',

    fetchQuais: async () => {
        try {
            const res = await apiClient.get<Quai[]>('/quais');
            set({ quais: res.data });
        } catch (e: any) {
            set({ error: e?.response?.data?.error || 'Erreur chargement quels' });
        }
    },

    fetchCamions: async (status) => {
        try {
            const res = await apiClient.get<Camion[]>(`/camions${status ? `?status=${status}` : ''}`);
            set({ camions: res.data });
        } catch {
            set({ error: 'Erreur chargement camions' });
        }
    },


    fetchHistorique: async (limit = 100) => {
        try {
            const res = await apiClient.get<Assignment[]>(`/assignments?active=false&limit=${limit}`);
            set({ historique: res.data });
        } catch {
            set({ historique: [] });
        }
    },

    fetchStats: async () => {
        try {
            const res = await apiClient.get<Stats>('/assignments/stats/summary');
            set({ stats: res.data });
        } catch {
            set({ stats: null });
        }
    },

    assignerCamion: async (quaiId, camionId, notes) => {
        set({ error: '' });
        await apiClient.post('/assignments', { quaiId, camionId, notes });
        await Promise.all([get().fetchQuais(), get().fetchCamions(), get().fetchStats()]);
    },

    libererQuai: async (assignmentId) => {
        set({ error: '' });
        await apiClient.put(`/assignments/${assignmentId}/liberer`, {});
        await Promise.all([get().fetchQuais(), get().fetchCamions(), get().fetchStats()]);
    },

    createQuai: async (nom, description) => {
        await apiClient.post('/quais', { nom, description });
        await get().fetchQuais();
    },

    updateQuai: async (id, nom, description) => {
        await apiClient.put(`/quais/${id}`, { nom, description });
        await get().fetchQuais();
    },

    deleteQuai: async (id) => {
        await apiClient.delete(`/quais/${id}`);
        await get().fetchQuais();
    },

    createCamion: async (matricule, transporteur) => {
        await apiClient.post('/camions', { matricule, transporteur });
        await get().fetchCamions();
    },

    updateCamion: async (id, matricule, transporteur) => {
        await apiClient.put(`/camions/${id}`, { matricule, transporteur });
        await get().fetchCamions();
    },

    deleteCamion: async (id) => {
        await apiClient.delete(`/camions/${id}`);
        await get().fetchCamions();
    },
}));

