import { useEffect } from 'react';
import { create } from 'zustand';
import { useSite } from '../store/useSite';

/**
 * Une seule horloge partagée pour tous les chronomètres de l'application
 * (au lieu d'un minuteur par camion), recalée sur l'heure du serveur.
 */
const useHorloge = create<{ t: number }>(() => ({ t: Date.now() }));

let abonnes = 0;
let minuteur: ReturnType<typeof setInterval> | undefined;

export function useMaintenant(): number {
    useEffect(() => {
        abonnes++;
        if (!minuteur) minuteur = setInterval(() => useHorloge.setState({ t: Date.now() }), 1000);
        return () => {
            abonnes--;
            if (abonnes === 0 && minuteur) {
                clearInterval(minuteur);
                minuteur = undefined;
            }
        };
    }, []);
    const t = useHorloge((s) => s.t);
    const decalage = useSite((s) => s.decalage);
    return t + decalage;
}
