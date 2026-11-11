import { z } from 'zod';

/** Schémas de validation des requêtes (messages en français, affichés tels quels). */

const id = z.string().min(1);
const texteOptionnel = z.string().max(500).nullish();

export const operation = z.enum(['CHARGEMENT', 'DECHARGEMENT'], {
    errorMap: () => ({ message: 'Précisez s’il s’agit d’un chargement ou d’un déchargement.' }),
});

export const destination = z.discriminatedUnion(
    'zone',
    [
        z.object({ zone: z.literal('ATTENTE') }),
        z.object({ zone: z.literal('QUAI'), quaiId: id }),
        z.object({ zone: z.literal('PARKING'), parkingSectionId: id }),
    ],
    { errorMap: () => ({ message: 'Destination invalide.' }) },
);

export const arrivee = z.object({
    matricule: z.string({ required_error: 'Le matricule est obligatoire.' }).trim().min(1, 'Le matricule est obligatoire.').max(30),
    transporteur: texteOptionnel,
    chauffeur: texteOptionnel,
    operation,
    notes: texteOptionnel,
    destination: destination.optional(),
});

export const sortie = z.object({ notes: texteOptionnel });

export const modificationVisite = z.object({
    operation: operation.optional(),
    chauffeur: texteOptionnel,
    notes: texteOptionnel,
});

export const filtresHistorique = z.object({
    q: z.string().optional(),
    operation: operation.optional(),
    du: z.coerce.date().optional(),
    au: z.coerce.date().optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(300),
});

export const camion = z.object({
    matricule: z.string().trim().min(1, 'Le matricule est obligatoire.').max(30),
    transporteur: texteOptionnel,
    type: texteOptionnel,
});

export const recherche = z.object({
    q: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(500).default(200),
});

export const quai = z.object({
    nom: z.string().trim().min(1, 'Le nom du quai est obligatoire.').max(60),
    description: texteOptionnel,
});

export const parking = z.object({
    nom: z.string().trim().min(1, 'Le nom du parking est obligatoire.').max(60),
    capacite: z.coerce.number().int().min(1, 'La capacité doit être d’au moins 1 place.').max(1000),
});

export const ordre = z.object({ ids: z.array(id) });

export const stats = z.object({ debutJournee: z.coerce.date().optional() });
