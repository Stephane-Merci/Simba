import { create } from 'zustand';

/** État de l'interface : modales, tiroir, notifications, confirmations. */

export interface Toast {
    id: number;
    type: 'succes' | 'erreur' | 'info';
    titre: string;
    message?: string;
}

interface DemandeConfirmation {
    titre: string;
    message: string;
    libelleOk?: string;
    danger?: boolean;
    resoudre: (ok: boolean) => void;
}

interface UiStore {
    /** Accueil (nouvelle arrivée) ; `matricule` pour pré-remplir. */
    accueil: { ouvert: boolean; matricule?: string };
    /** Fiche du camion (tiroir latéral). */
    visiteOuverte: string | null;
    /** Confirmation de sortie. */
    sortieVisite: string | null;
    toasts: Toast[];
    confirmation: DemandeConfirmation | null;

    ouvrirAccueil: (matricule?: string) => void;
    fermerAccueil: () => void;
    ouvrirVisite: (id: string) => void;
    fermerVisite: () => void;
    ouvrirSortie: (id: string) => void;
    fermerSortie: () => void;
    notifier: (t: Omit<Toast, 'id'>) => void;
    retirerToast: (id: number) => void;
    confirmer: (d: Omit<DemandeConfirmation, 'resoudre'>) => Promise<boolean>;
    repondre: (ok: boolean) => void;
}

let prochainId = 1;

export const useUi = create<UiStore>((set, get) => ({
    accueil: { ouvert: false },
    visiteOuverte: null,
    sortieVisite: null,
    toasts: [],
    confirmation: null,

    ouvrirAccueil: (matricule) => set({ accueil: { ouvert: true, matricule } }),
    fermerAccueil: () => set({ accueil: { ouvert: false } }),
    ouvrirVisite: (id) => set({ visiteOuverte: id }),
    fermerVisite: () => set({ visiteOuverte: null }),
    ouvrirSortie: (id) => set({ sortieVisite: id }),
    fermerSortie: () => set({ sortieVisite: null }),

    notifier: (t) => {
        const id = prochainId++;
        set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }));
        setTimeout(() => get().retirerToast(id), t.type === 'erreur' ? 6000 : 3500);
    },
    retirerToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    confirmer: (d) =>
        new Promise<boolean>((resoudre) => {
            get().confirmation?.resoudre(false);
            set({ confirmation: { ...d, resoudre } });
        }),
    repondre: (ok) => {
        get().confirmation?.resoudre(ok);
        set({ confirmation: null });
    },
}));

export const notifier = (t: Omit<Toast, 'id'>) => useUi.getState().notifier(t);
export const confirmer = (d: Omit<DemandeConfirmation, 'resoudre'>) => useUi.getState().confirmer(d);
