import { create } from 'zustand';
import { siteApi, visitesApi } from '../api/simba';
import { messageErreur } from '../api/client';
import { libelleDestination, sejourActuel } from '../lib/parcours';
import type { ArriveeInput, Destination, EtatSite, Stats, Visite } from '../types';
import { notifier } from './useUi';

/**
 * État du site partagé par tous les écrans.
 * Source de vérité = serveur ; les déplacements sont appliqués immédiatement
 * à l'écran (optimiste) puis confirmés ou annulés selon la réponse.
 */
interface SiteStore {
    etat: EtatSite | null;
    stats: Stats | null;
    /** Décalage horloge serveur − horloge locale (ms), pour des chronos justes. */
    decalage: number;
    connecte: boolean;
    erreurChargement: string | null;

    charger: () => Promise<void>;
    chargerStats: () => Promise<void>;
    setConnecte: (c: boolean) => void;

    arrivee: (input: ArriveeInput) => Promise<Visite>;
    deplacer: (visiteId: string, destination: Destination) => Promise<boolean>;
    sortie: (visiteId: string, notes?: string) => Promise<Visite>;
    annuler: (visiteId: string) => Promise<void>;
    remplacerVisite: (v: Visite) => void;
}

const minuitLocal = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

export const useSite = create<SiteStore>((set, get) => ({
    etat: null,
    stats: null,
    decalage: 0,
    connecte: false,
    erreurChargement: null,

    charger: async () => {
        try {
            const etat = await siteApi.etat();
            set({ etat, decalage: new Date(etat.serverTime).getTime() - Date.now(), erreurChargement: null });
        } catch (e) {
            set({ erreurChargement: messageErreur(e) });
        }
    },

    chargerStats: async () => {
        try {
            set({ stats: await siteApi.stats(minuitLocal()) });
        } catch {
            /* indicateurs non bloquants */
        }
    },

    setConnecte: (connecte) => set({ connecte }),

    arrivee: async (input) => {
        const visite = await visitesApi.arrivee(input);
        get().remplacerVisite(visite);
        void get().chargerStats();
        return visite;
    },

    deplacer: async (visiteId, destination) => {
        const avant = get().etat;
        if (!avant) return false;
        const visite = avant.visites.find((v) => v.id === visiteId);
        if (!visite) return false;

        // Application optimiste : on ferme le séjour en cours et on ouvre le nouveau.
        const maintenant = new Date(Date.now() + get().decalage).toISOString();
        const libelle = libelleDestination(avant, destination);
        const provisoire: Visite = {
            ...visite,
            sejours: [
                ...visite.sejours.map((s) => (s.fin ? s : { ...s, fin: maintenant })),
                {
                    id: `tmp-${Date.now()}`,
                    visiteId,
                    zone: destination.zone,
                    libelle,
                    quaiId: destination.zone === 'QUAI' ? destination.quaiId : null,
                    parkingSectionId: destination.zone === 'PARKING' ? destination.parkingSectionId : null,
                    debut: maintenant,
                    fin: null,
                    dureeMinutes: null,
                },
            ],
        };
        get().remplacerVisite(provisoire);

        try {
            const confirmee = await visitesApi.deplacer(visiteId, destination);
            get().remplacerVisite(confirmee);
            notifier({ type: 'succes', titre: `${visite.camion.matricule} → ${sejourActuel(confirmee)?.libelle ?? libelle}` });
            return true;
        } catch (e) {
            get().remplacerVisite(visite);
            notifier({ type: 'erreur', titre: 'Déplacement impossible', message: messageErreur(e) });
            void get().charger();
            return false;
        }
    },

    sortie: async (visiteId, notes) => {
        const visite = await visitesApi.sortie(visiteId, notes);
        set((s) => (s.etat ? { etat: { ...s.etat, visites: s.etat.visites.filter((v) => v.id !== visiteId) } } : s));
        void get().chargerStats();
        return visite;
    },

    annuler: async (visiteId) => {
        await visitesApi.annuler(visiteId);
        set((s) => (s.etat ? { etat: { ...s.etat, visites: s.etat.visites.filter((v) => v.id !== visiteId) } } : s));
        void get().chargerStats();
    },

    remplacerVisite: (v) =>
        set((s) => {
            if (!s.etat) return s;
            const existe = s.etat.visites.some((x) => x.id === v.id);
            const visites = existe ? s.etat.visites.map((x) => (x.id === v.id ? v : x)) : [...s.etat.visites, v];
            return { etat: { ...s.etat, visites } };
        }),
}));
