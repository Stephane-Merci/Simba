import type { Server } from 'socket.io';
import { utilisateurDuJeton } from '../services/authService';

/**
 * Diffusion temps réel. Les services appellent `notifierSite()` après chaque
 * modification ; tous les écrans connectés se rafraîchissent instantanément.
 */
let io: Server | null = null;

export const EVENEMENT_SITE = 'site:maj';

export function brancherTempsReel(server: Server) {
    // Seuls les postes connectés reçoivent les mises à jour.
    server.use((socket, next) => {
        const jeton = (socket.handshake.auth as { jeton?: unknown } | undefined)?.jeton;
        utilisateurDuJeton(typeof jeton === 'string' ? jeton : undefined)
            .then((u) => next(u ? undefined : new Error('non-autorise')))
            .catch(() => next(new Error('non-autorise')));
    });
    io = server;
}

export function notifierSite(motif: string) {
    io?.emit(EVENEMENT_SITE, { motif, at: new Date().toISOString() });
}
