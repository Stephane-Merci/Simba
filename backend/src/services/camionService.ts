import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { HttpError, conflit } from '../lib/http';
import { notifierSite } from '../lib/realtime';
import { cleMatricule, normaliserMatricule, texteOuNull } from '../domain/regles';

/** Registre des véhicules : un camion est retrouvé par son matricule à chaque passage. */

type Client = Prisma.TransactionClient | typeof prisma;

const SQL_CLE = Prisma.sql`regexp_replace(upper("matricule"), '[^A-Z0-9]', '', 'g')`;

/** Retrouve un camion quel que soit le format de saisie du matricule (tirets, espaces…). */
export async function trouverParMatricule(client: Client, saisie: string) {
    const cle = cleMatricule(saisie);
    if (!cle) return null;
    const lignes = await client.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "Camion" WHERE ${SQL_CLE} = ${cle} LIMIT 1`;
    return lignes[0] ? client.camion.findUnique({ where: { id: lignes[0].id } }) : null;
}

async function idsCorrespondant(terme: string): Promise<string[]> {
    const cle = cleMatricule(terme);
    if (!cle) return [];
    const lignes = await prisma.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "Camion" WHERE ${SQL_CLE} LIKE ${`%${cle}%`}`;
    return lignes.map((l) => l.id);
}

const avecDerniereVisite = {
    _count: { select: { visites: true } },
    visites: {
        orderBy: { arrivee: 'desc' },
        take: 1,
        include: { sejours: { where: { fin: null } } },
    },
} satisfies Prisma.CamionInclude;

export async function rechercher(q: string | undefined, limit: number) {
    const terme = q?.trim();
    const where: Prisma.CamionWhereInput = terme
        ? {
              OR: [
                  { id: { in: await idsCorrespondant(terme) } },
                  { transporteur: { contains: terme, mode: 'insensitive' } },
              ],
          }
        : {};
    return prisma.camion.findMany({
        where,
        include: avecDerniereVisite,
        orderBy: { updatedAt: 'desc' },
        take: limit,
    });
}

export async function creer(data: { matricule: string; transporteur?: string | null; type?: string | null }) {
    const matricule = normaliserMatricule(data.matricule);
    if (!matricule) throw new HttpError(400, 'Matricule invalide.');
    const existe = await trouverParMatricule(prisma, matricule);
    if (existe) throw conflit(`Le camion ${existe.matricule} est déjà enregistré.`);
    const camion = await prisma.camion.create({
        data: { matricule, transporteur: texteOuNull(data.transporteur), type: texteOuNull(data.type) ?? undefined },
        include: avecDerniereVisite,
    });
    notifierSite('camion');
    return camion;
}

export async function modifier(
    id: string,
    data: { matricule?: string; transporteur?: string | null; type?: string | null },
) {
    const matricule = data.matricule !== undefined ? normaliserMatricule(data.matricule) : undefined;
    if (matricule !== undefined) {
        if (!matricule) throw new HttpError(400, 'Matricule invalide.');
        const autre = await trouverParMatricule(prisma, matricule);
        if (autre && autre.id !== id) throw conflit(`Le matricule ${autre.matricule} est déjà utilisé.`);
    }
    const camion = await prisma.camion.update({
        where: { id },
        data: {
            matricule,
            ...(data.transporteur !== undefined ? { transporteur: texteOuNull(data.transporteur) } : {}),
            ...(data.type !== undefined ? { type: texteOuNull(data.type) } : {}),
        },
        include: avecDerniereVisite,
    });
    notifierSite('camion');
    return camion;
}

/** Supprime le camion et son historique. Interdit tant qu'il est sur site. */
export async function supprimer(id: string) {
    const surSite = await prisma.visite.findFirst({ where: { camionId: id, depart: null } });
    if (surSite) throw conflit('Ce camion est sur site. Enregistrez sa sortie avant de le supprimer.');
    await prisma.camion.delete({ where: { id } });
    notifierSite('camion');
}
