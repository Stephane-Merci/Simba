import { prisma } from '../lib/prisma';
import { visiteInclude } from './visiteService';

/**
 * Photographie du site en un seul appel : quais, parkings et camions présents.
 * L'emplacement de chaque camion = son séjour sans date de fin.
 */
export async function etatDuSite() {
    const [quais, parkings, visites] = await Promise.all([
        prisma.quai.findMany({ where: { isActive: true }, orderBy: [{ ordre: 'asc' }, { createdAt: 'asc' }] }),
        prisma.parkingSection.findMany({ orderBy: [{ ordre: 'asc' }, { createdAt: 'asc' }] }),
        prisma.visite.findMany({ where: { depart: null }, include: visiteInclude, orderBy: { arrivee: 'asc' } }),
    ]);
    return { quais, parkings, visites, serverTime: new Date().toISOString() };
}

const TRENTE_JOURS_MS = 30 * 24 * 3600 * 1000;

/**
 * Indicateurs : sorties depuis `debutJournee` (minuit local, fourni par le client
 * pour respecter son fuseau horaire) et temps moyens sur les 30 derniers jours.
 */
export async function statistiques(debutJournee: Date) {
    const depuis = new Date(Date.now() - TRENTE_JOURS_MS);
    const [sortiesDuJour, arriveesDuJour, moyenneVisite, parZone] = await Promise.all([
        prisma.visite.count({ where: { depart: { gte: debutJournee } } }),
        prisma.visite.count({ where: { arrivee: { gte: debutJournee } } }),
        prisma.visite.aggregate({ _avg: { dureeMinutes: true }, _count: true, where: { depart: { gte: depuis } } }),
        prisma.sejour.groupBy({ by: ['zone'], _avg: { dureeMinutes: true }, where: { fin: { gte: depuis } } }),
    ]);

    const moyenneZone = (zone: string) =>
        Math.round(parZone.find((z) => z.zone === zone)?._avg.dureeMinutes ?? 0);

    return {
        sortiesDuJour,
        arriveesDuJour,
        visites30j: moyenneVisite._count,
        moyenneVisiteMinutes: Math.round(moyenneVisite._avg.dureeMinutes ?? 0),
        moyenneParZoneMinutes: {
            ATTENTE: moyenneZone('ATTENTE'),
            PARKING: moyenneZone('PARKING'),
            QUAI: moyenneZone('QUAI'),
        },
    };
}
