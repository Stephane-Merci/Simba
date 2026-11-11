import { Operation, Prisma, Zone } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { HttpError, conflit, introuvable } from '../lib/http';
import { notifierSite } from '../lib/realtime';
import { minutesEntre, normaliserMatricule, pluriel, texteOuNull } from '../domain/regles';
import { trouverParMatricule } from './camionService';

/**
 * Parcours d'un camion sur site :
 *   arrivée (accueil) → déplacements entre accueil / parkings / quais → sortie.
 * Toutes les opérations sont transactionnelles (isolation sérialisable) pour éviter
 * que deux postes affectent le même quai ou la dernière place d'un parking en même temps.
 */

export type Destination =
    | { zone: 'ATTENTE' }
    | { zone: 'QUAI'; quaiId: string }
    | { zone: 'PARKING'; parkingSectionId: string };

export interface ArriveeInput {
    matricule: string;
    transporteur?: string | null;
    chauffeur?: string | null;
    operation: Operation;
    notes?: string | null;
    destination?: Destination;
}

export interface FiltresHistorique {
    q?: string;
    operation?: Operation;
    du?: Date;
    au?: Date;
    limit: number;
}

type Tx = Prisma.TransactionClient;

const SERIALISABLE = { isolationLevel: Prisma.TransactionIsolationLevel.Serializable };

export const visiteInclude = {
    camion: true,
    sejours: { orderBy: { debut: 'asc' } },
} satisfies Prisma.VisiteInclude;

const LIBELLE_ACCUEIL = 'Accueil';

/** Vérifie que la destination est disponible et retourne l'emplacement à enregistrer. */
async function reserverEmplacement(tx: Tx, destination: Destination, visiteId?: string) {
    const autreVisite = visiteId ? { visiteId: { not: visiteId } } : {};

    switch (destination.zone) {
        case 'ATTENTE':
            return { zone: Zone.ATTENTE, libelle: LIBELLE_ACCUEIL, quaiId: null, parkingSectionId: null };

        case 'QUAI': {
            const quai = await tx.quai.findUnique({ where: { id: destination.quaiId } });
            if (!quai || !quai.isActive) throw introuvable('Quai introuvable.');
            const occupant = await tx.sejour.findFirst({
                where: { quaiId: quai.id, fin: null, ...autreVisite },
                include: { visite: { include: { camion: true } } },
            });
            if (occupant) {
                throw conflit(`${quai.nom} est déjà occupé par ${occupant.visite.camion.matricule}.`);
            }
            return { zone: Zone.QUAI, libelle: quai.nom, quaiId: quai.id, parkingSectionId: null };
        }

        case 'PARKING': {
            const section = await tx.parkingSection.findUnique({ where: { id: destination.parkingSectionId } });
            if (!section) throw introuvable('Zone de parking introuvable.');
            const occupes = await tx.sejour.count({
                where: { parkingSectionId: section.id, fin: null, ...autreVisite },
            });
            if (occupes >= section.capacite) {
                throw conflit(`${section.nom} est complet (${pluriel(section.capacite, 'place')}).`);
            }
            return { zone: Zone.PARKING, libelle: section.nom, quaiId: null, parkingSectionId: section.id };
        }
    }
}

function estAuMemeEndroit(
    sejour: { zone: Zone; quaiId: string | null; parkingSectionId: string | null },
    destination: Destination,
) {
    if (sejour.zone !== destination.zone) return false;
    if (destination.zone === 'QUAI') return sejour.quaiId === destination.quaiId;
    if (destination.zone === 'PARKING') return sejour.parkingSectionId === destination.parkingSectionId;
    return true;
}

async function fermerSejourEnCours(tx: Tx, visiteId: string, maintenant: Date) {
    const enCours = await tx.sejour.findFirst({ where: { visiteId, fin: null } });
    if (enCours) {
        await tx.sejour.update({
            where: { id: enCours.id },
            data: { fin: maintenant, dureeMinutes: minutesEntre(enCours.debut, maintenant) },
        });
    }
    return enCours;
}

async function visiteActive(tx: Tx, id: string) {
    const visite = await tx.visite.findUnique({ where: { id } });
    if (!visite) throw introuvable('Visite introuvable.');
    if (visite.depart) throw conflit('Ce camion a déjà quitté le site.');
    return visite;
}

/** Accueil : enregistre (ou retrouve) le camion et ouvre une nouvelle visite. */
export async function enregistrerArrivee(input: ArriveeInput) {
    const matricule = normaliserMatricule(input.matricule);
    if (!matricule) throw new HttpError(400, 'Matricule invalide.');
    const transporteur = texteOuNull(input.transporteur);

    const visite = await prisma.$transaction(async (tx) => {
        // Camion déjà venu → on le rappelle ; sinon on l'enregistre.
        const connu = await trouverParMatricule(tx, matricule);
        const camion = connu
            ? transporteur && transporteur !== connu.transporteur
                ? await tx.camion.update({ where: { id: connu.id }, data: { transporteur } })
                : connu
            : await tx.camion.create({ data: { matricule, transporteur } });

        const dejaSurSite = await tx.visite.findFirst({ where: { camionId: camion.id, depart: null } });
        if (dejaSurSite) throw conflit(`${camion.matricule} est déjà sur site.`);

        const emplacement = await reserverEmplacement(tx, input.destination ?? { zone: 'ATTENTE' });
        const maintenant = new Date();

        return tx.visite.create({
            data: {
                camionId: camion.id,
                operation: input.operation,
                chauffeur: texteOuNull(input.chauffeur),
                notes: texteOuNull(input.notes),
                arrivee: maintenant,
                sejours: { create: { ...emplacement, debut: maintenant } },
            },
            include: visiteInclude,
        });
    }, SERIALISABLE);

    notifierSite('arrivee');
    return visite;
}

/** Déplace un camion vers l'accueil, un parking ou un quai (dans n'importe quel sens). */
export async function deplacer(visiteId: string, destination: Destination) {
    const visite = await prisma.$transaction(async (tx) => {
        await visiteActive(tx, visiteId);

        const actuel = await tx.sejour.findFirst({ where: { visiteId, fin: null } });
        if (actuel && estAuMemeEndroit(actuel, destination)) {
            return tx.visite.findUniqueOrThrow({ where: { id: visiteId }, include: visiteInclude });
        }

        const emplacement = await reserverEmplacement(tx, destination, visiteId);
        const maintenant = new Date();
        await fermerSejourEnCours(tx, visiteId, maintenant);
        await tx.sejour.create({ data: { visiteId, ...emplacement, debut: maintenant } });

        return tx.visite.findUniqueOrThrow({ where: { id: visiteId }, include: visiteInclude });
    }, SERIALISABLE);

    notifierSite('deplacement');
    return visite;
}

/** Sortie : le gestionnaire désaffecte le camion, la visite est clôturée. */
export async function enregistrerSortie(visiteId: string, notes?: string | null) {
    const visite = await prisma.$transaction(async (tx) => {
        const v = await visiteActive(tx, visiteId);
        const maintenant = new Date();
        await fermerSejourEnCours(tx, visiteId, maintenant);
        return tx.visite.update({
            where: { id: visiteId },
            data: {
                depart: maintenant,
                dureeMinutes: minutesEntre(v.arrivee, maintenant),
                ...(notes !== undefined ? { notes: texteOuNull(notes) } : {}),
            },
            include: visiteInclude,
        });
    }, SERIALISABLE);

    notifierSite('sortie');
    return visite;
}

/** Annule une arrivée saisie par erreur (visite en cours uniquement). */
export async function annulerArrivee(visiteId: string) {
    await prisma.$transaction(async (tx) => {
        await visiteActive(tx, visiteId);
        await tx.visite.delete({ where: { id: visiteId } });
    });
    notifierSite('annulation');
}

export async function modifierVisite(
    visiteId: string,
    data: { operation?: Operation; chauffeur?: string | null; notes?: string | null },
) {
    const visite = await prisma.visite.update({
        where: { id: visiteId },
        data: {
            operation: data.operation,
            ...(data.chauffeur !== undefined ? { chauffeur: texteOuNull(data.chauffeur) } : {}),
            ...(data.notes !== undefined ? { notes: texteOuNull(data.notes) } : {}),
        },
        include: visiteInclude,
    });
    notifierSite('modification');
    return visite;
}

export async function detail(visiteId: string) {
    const visite = await prisma.visite.findUnique({ where: { id: visiteId }, include: visiteInclude });
    if (!visite) throw introuvable('Visite introuvable.');
    return visite;
}

export async function historique(filtres: FiltresHistorique) {
    const where: Prisma.VisiteWhereInput = { depart: { not: null } };
    if (filtres.operation) where.operation = filtres.operation;
    if (filtres.du || filtres.au) {
        where.arrivee = {
            ...(filtres.du ? { gte: filtres.du } : {}),
            ...(filtres.au ? { lte: filtres.au } : {}),
        };
    }
    const q = filtres.q?.trim();
    if (q) {
        const contient = { contains: q, mode: 'insensitive' as const };
        where.OR = [
            { camion: { matricule: contient } },
            { camion: { transporteur: contient } },
            { chauffeur: contient },
            { sejours: { some: { libelle: contient } } },
        ];
    }
    return prisma.visite.findMany({
        where,
        include: visiteInclude,
        orderBy: { arrivee: 'desc' },
        take: filtres.limit,
    });
}
