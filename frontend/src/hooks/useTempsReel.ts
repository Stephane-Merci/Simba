import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../api/client';
import { useSite } from '../store/useSite';

const EVENEMENT_SITE = 'site:maj';
const SECOURS_MS = 30000;

/**
 * Synchronisation temps réel : chaque modification faite sur un poste est
 * immédiatement visible sur les autres. Un rafraîchissement périodique sert
 * de filet de sécurité si la connexion est coupée.
 */
export function useTempsReel() {
    useEffect(() => {
        const { charger, chargerStats, setConnecte } = useSite.getState();
        void charger();
        void chargerStats();

        let differe: ReturnType<typeof setTimeout> | undefined;
        const rafraichir = () => {
            clearTimeout(differe);
            differe = setTimeout(() => {
                void charger();
                void chargerStats();
            }, 150);
        };

        const socket = io(SOCKET_URL ?? '/', { transports: ['websocket', 'polling'] });
        socket.on('connect', () => {
            setConnecte(true);
            rafraichir();
        });
        socket.on('disconnect', () => setConnecte(false));
        socket.on(EVENEMENT_SITE, rafraichir);

        const secours = setInterval(rafraichir, SECOURS_MS);
        const auRetour = () => document.visibilityState === 'visible' && rafraichir();
        document.addEventListener('visibilitychange', auRetour);

        return () => {
            clearTimeout(differe);
            clearInterval(secours);
            document.removeEventListener('visibilitychange', auRetour);
            socket.disconnect();
        };
    }, []);
}
