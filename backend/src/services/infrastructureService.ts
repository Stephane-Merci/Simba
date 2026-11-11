import { prisma } from '../lib/prisma';
import { HttpError, conflit } from '../lib/http';
import { notifierSite } from '../lib/realtime';
import { pluriel, texteOuNull } from '../domain/regles';

/** Configuration du site : quais et zones de parking. */

// ── Quais ────────────────────────────────────────────────────────────────

export async function creerQuai(data: { nom: string; description?: string | null }) {
    const ordre = await prisma.quai.count();
    const quai = await prisma.quai.create({
        data: { nom: data.nom.trim(), description: texteOuNull(data.description), ordre },
    });
    notifierSite('quai');
    return quai;
}

export async function modifierQuai(id: string, data: { nom?: string; description?: string | null }) {
    const quai = await prisma.quai.update({
        where: { id },
        data: {
            ...(data.nom !== undefined ? { nom: data.nom.trim() } : {}),
            ...(data.description !== undefined ? { description: texteOuNull(data.description) } : {}),
        },
    });
    notifierSite('quai');
    return quai;
}

/** Suppression logique : l'historique des séjours sur ce quai est conservé. */
export async function supprimerQuai(id: string) {
    const occupe = await prisma.sejour.findFirst({ where: { quaiId: id, fin: null } });
    if (occupe) throw conflit('Ce quai est occupé. Déplacez le camion avant de le supprimer.');
    await prisma.quai.update({ where: { id }, data: { isActive: false } });
    notifierSite('quai');
}

export async function reordonnerQuais(ids: string[]) {
    await prisma.$transaction(ids.map((id, ordre) => prisma.quai.update({ where: { id }, data: { ordre } })));
    notifierSite('quai');
}

// ── Parkings ─────────────────────────────────────────────────────────────

export async function creerParking(data: { nom: string; capacite: number }) {
    const ordre = await prisma.parkingSection.count();
    const section = await prisma.parkingSection.create({
        data: { nom: data.nom.trim(), capacite: data.capacite, ordre },
    });
    notifierSite('parking');
    return section;
}

export async function modifierParking(id: string, data: { nom?: string; capacite?: number }) {
    if (data.capacite !== undefined) {
        const occupes = await prisma.sejour.count({ where: { parkingSectionId: id, fin: null } });
        if (data.capacite < occupes) {
            throw new HttpError(
                400,
                `Impossible : ${pluriel(occupes, 'camion est', 'camions sont')} actuellement dans ce parking.`,
            );
        }
    }
    const section = await prisma.parkingSection.update({
        where: { id },
        data: { ...(data.nom !== undefined ? { nom: data.nom.trim() } : {}), capacite: data.capacite },
    });
    notifierSite('parking');
    return section;
}

export async function supprimerParking(id: string) {
    const occupes = await prisma.sejour.count({ where: { parkingSectionId: id, fin: null } });
    if (occupes > 0) throw conflit('Ce parking contient des camions. Déplacez-les avant de le supprimer.');
    await prisma.parkingSection.delete({ where: { id } });
    notifierSite('parking');
}
