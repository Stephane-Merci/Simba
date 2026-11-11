import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';

/** Erreur métier avec un code HTTP et un message destiné à l'utilisateur (en français). */
export class HttpError extends Error {
    constructor(public readonly status: number, message: string) {
        super(message);
    }
}

export const introuvable = (message: string) => new HttpError(404, message);
export const conflit = (message: string) => new HttpError(409, message);

/** Transmet les erreurs des handlers async au middleware d'erreurs (Express 4). */
export const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
    (req, res, next) => {
        fn(req, res, next).catch(next);
    };

export const gestionErreurs: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ZodError) {
        res.status(400).json({ error: err.issues[0]?.message ?? 'Données invalides', details: err.issues });
        return;
    }
    if (err instanceof HttpError) {
        res.status(err.status).json({ error: err.message });
        return;
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        const messages: Record<string, [number, string]> = {
            P2002: [409, 'Cette valeur existe déjà.'],
            P2025: [404, 'Élément introuvable.'],
            P2034: [409, 'Une autre opération a eu lieu en même temps. Veuillez réessayer.'],
        };
        const connu = messages[err.code];
        if (connu) {
            res.status(connu[0]).json({ error: connu[1] });
            return;
        }
    }
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
};
