import { create } from 'zustand';
import apiClient from '../api/client';
import { Quai, Assignment, Stats, Camion, ParkingSection } from '../types';

interface SimbaStore {
    quais: Quai[];
    parkingSections: ParkingSection[];
    camions: Camion[];
    historique: Assignment[];
    stats: Stats | null;
    loading: boolean;
    error: string;

    fetchQuais: () => Promise<void>;
    fetchParkingSections: () => Promise<void>;
    fetchCamions: (status?: string) => Promise<void>;
    fetchHistorique: (limit?: number) => Promise<void>;
    fetchStats: () => Promise<void>;
    assignerCamion: (quaiId: string, camionId: string, notes?: string) => Promise<void>;
    deplacerAuParking: (camionId: string, sectionId: string) => Promise<void>;
    renvoyerAEntree: (camionId: string) => Promise<void>;
    libererQuai: (assignmentId: string) => Promise<void>;
    createQuai: (nom: string, description?: string) => Promise<void>;
    updateQuai: (id: string, nom: string, description?: string) => Promise<void>;
    deleteQuai: (id: string) => Promise<void>;
    createCamion: (matricule: string, transporteur?: string) => Promise<void>;
    updateCamion: (id: string, matricule: string, transporteur?: string) => Promise<void>;
    deleteCamion: (id: string) => Promise<void>;
    createParkingSection: (nom: string, capacite: number, ordre?: number) => Promise<void>;
    deleteParkingSection: (id: string) => Promise<void>;
}

export const useStore = create<SimbaStore>((set, get) => ({
    quais: [],
    parkingSections: [],
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
            set({ error: e?.response?.data?.error || 'Erreur chargement quais' });
        }
    },

    fetchParkingSections: async () => {
        try {
            const res = await apiClient.get<ParkingSection[]>('/parking-sections');
            set({ parkingSections: res.data });
        } catch {
            set({ error: 'Erreur chargement sections parking' });
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
        await Promise.all([get().fetchQuais(), get().fetchCamions(), get().fetchStats(), get().fetchParkingSections()]);
    },

    deplacerAuParking: async (camionId, sectionId) => {
        set({ error: '' });
        await apiClient.put(`/camions/${camionId}`, { 
            status: 'PARKING', 
            parkingSectionId: sectionId 
        });
        await Promise.all([get().fetchCamions(), get().fetchParkingSections()]);
    },

    renvoyerAEntree: async (camionId) => {
        set({ error: '' });
        await apiClient.put(`/camions/${camionId}`, { 
            status: 'PARTI', 
            parkingSectionId: null
        });
        await Promise.all([get().fetchCamions(), get().fetchParkingSections()]);
    },

    libererQuai: async (assignmentId) => {
        set({ error: '' });
        await apiClient.put(`/assignments/${assignmentId}/liberer`, {});
        await Promise.all([get().fetchQuais(), get().fetchCamions(), get().fetchStats(), get().fetchParkingSections()]);
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

    createParkingSection: async (nom, capacite, ordre) => {
        await apiClient.post('/parking-sections', { nom, capacite, ordre });
        await get().fetchParkingSections();
    },

    deleteParkingSection: async (id) => {
        await apiClient.delete(`/parking-sections/${id}`);
        await get().fetchParkingSections();
    },
}));

