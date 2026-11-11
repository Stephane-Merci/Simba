import type { Server } from 'socket.io';

/**
 * Diffusion temps réel. Les services appellent `notifierSite()` après chaque
 * modification ; tous les écrans connectés se rafraîchissent instantanément.
 */
let io: Server | null = null;

export const EVENEMENT_SITE = 'site:maj';

export function brancherTempsReel(server: Server) {
    io = server;
}

export function notifierSite(motif: string) {
    io?.emit(EVENEMENT_SITE, { motif, at: new Date().toISOString() });
}
