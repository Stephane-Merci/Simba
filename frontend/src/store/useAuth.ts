import { create } from 'zustand';

/** Session de l'utilisateur connecté (jeton conservé dans le navigateur). */

export interface Utilisateur {
    id: string;
    identifiant: string;
    nom: string;
}

const CLE = 'simba.jeton';

function lire(): string | null {
    try {
        return localStorage.getItem(CLE);
    } catch {
        return null;
    }
}

function ecrire(jeton: string | null) {
    try {
        if (jeton) localStorage.setItem(CLE, jeton);
        else localStorage.removeItem(CLE);
    } catch {
        /* stockage indisponible : la session ne durera que le temps de l'onglet */
    }
}

interface AuthStore {
    jeton: string | null;
    utilisateur: Utilisateur | null;
    ouvrir: (jeton: string, utilisateur?: Utilisateur) => void;
    setUtilisateur: (u: Utilisateur) => void;
    fermer: () => void;
}

export const useAuth = create<AuthStore>((set) => ({
    jeton: lire(),
    utilisateur: null,
    ouvrir: (jeton, utilisateur) => {
        ecrire(jeton);
        set((s) => ({ jeton, utilisateur: utilisateur ?? s.utilisateur }));
    },
    setUtilisateur: (utilisateur) => set({ utilisateur }),
    fermer: () => {
        ecrire(null);
        set({ jeton: null, utilisateur: null });
    },
}));
