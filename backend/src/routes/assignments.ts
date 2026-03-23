import express from 'express';
import { prisma, io } from '../index';
import { z } from 'zod';

const router = express.Router();

const assignSchema = z.object({
    quaiId: z.string().min(1),
    camionId: z.string().min(1),
    arrivee: z.string().optional(),
    notes: z.string().optional(),
});

// GET all assignments
router.get('/', async (req, res) => {
    try {
        const { active, quaiId, limit } = req.query;
        const where: any = {};
        if (active === 'true') where.depart = null;
        if (active === 'false') where.depart = { not: null };
        if (quaiId) where.quaiId = quaiId;

        const assignments = await prisma.assignment.findMany({
            where,
            include: { quai: true, camion: true },
            orderBy: { arrivee: 'desc' },
            take: limit ? parseInt(limit as string) : undefined,
        });
        res.json(assignments);
    } catch {
        res.status(500).json({ error: 'Erreur lors de la récupération des assignments' });
    }
});

// POST assign truck to quai
router.post('/', async (req, res) => {
    try {
        const data = assignSchema.parse(req.body);

        // Check quai exists and is active
        const quai = await prisma.quai.findUnique({ where: { id: data.quaiId } });
        if (!quai || !quai.isActive) {
            return res.status(404).json({ error: 'Quai introuvable' });
        }

        // Check camion exists and is available
        const camion = await prisma.camion.findUnique({ where: { id: data.camionId } });
        if (!camion) return res.status(404).json({ error: 'Camion introuvable' });
        if (camion.status === 'A_QUAI') return res.status(400).json({ error: 'Camion déjà à quai' });

        // Check quai is not already occupied
        const existing = await prisma.assignment.findFirst({
            where: { quaiId: data.quaiId, depart: null },
        });
        if (existing) {
            return res.status(400).json({ error: `Quai déjà occupé` });
        }

        const assignment = await prisma.$transaction(async (tx) => {
            const ass = await tx.assignment.create({
                data: {
                    quaiId: data.quaiId,
                    camionId: data.camionId,
                    arrivee: data.arrivee ? new Date(data.arrivee) : new Date(),
                    notes: data.notes,
                },
                include: { quai: true, camion: true },
            });

            await tx.camion.update({
                where: { id: data.camionId },
                data: { 
                    status: 'A_QUAI',
                    parkingSectionId: null
                },
            });

            return ass;
        });

        io.emit('assignment-updated', { room: 'main' });
        io.emit('camions-updated', { room: 'main' });
        res.status(201).json(assignment);
    } catch (e: any) {
        if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
        res.status(500).json({ error: "Erreur lors de l'assignation" });
    }
});

// PUT /assignments/:id/liberer
router.put('/:id/liberer', async (req, res) => {
    try {
        const { notes } = req.body;
        const assignment = await prisma.assignment.findUnique({ where: { id: req.params.id } });
        if (!assignment) return res.status(404).json({ error: 'Assignment introuvable' });
        if (assignment.depart) return res.status(400).json({ error: 'Déjà libéré' });

        const depart = new Date();
        const dureeMinutes = Math.round((depart.getTime() - assignment.arrivee.getTime()) / 60000);

        const updated = await prisma.$transaction(async (tx) => {
            const ass = await tx.assignment.update({
                where: { id: req.params.id },
                data: { depart, dureeMinutes, notes: notes ?? assignment.notes },
                include: { quai: true, camion: true },
            });

            await tx.camion.update({
                where: { id: assignment.camionId },
                data: { 
                    status: 'PARTI',
                    parkingSectionId: null
                },
            });

            return ass;
        });


        io.emit('assignment-updated', { room: 'main' });
        io.emit('camions-updated', { room: 'main' });
        res.json(updated);
    } catch {
        res.status(500).json({ error: 'Erreur lors de la libération' });
    }
});

// DELETE assignment
router.delete('/:id', async (req, res) => {
    try {
        const ass = await prisma.assignment.findUnique({ where: { id: req.params.id } });
        if (ass && !ass.depart) {
            await prisma.camion.update({
                where: { id: ass.camionId },
                data: { status: 'PARKING' },
            });
        }
        await prisma.assignment.delete({ where: { id: req.params.id } });
        io.emit('assignment-updated', { room: 'main' });
        io.emit('camions-updated', { room: 'main' });
        res.status(204).send();
    } catch {
        res.status(500).json({ error: 'Erreur suppression' });
    }
});

// GET stats
router.get('/stats/summary', async (_req, res) => {
    try {
        const [totalQuais, occupes, totalHistorique, avgDuree, totalCamions] = await Promise.all([
            prisma.quai.count({ where: { isActive: true } }),
            prisma.assignment.count({ where: { depart: null } }),
            prisma.assignment.count({ where: { depart: { not: null } } }),
            prisma.assignment.aggregate({
                _avg: { dureeMinutes: true },
                where: { depart: { not: null } },
            }),
            prisma.camion.count(),
        ]);
        res.json({
            totalQuais,
            occupes,
            libres: totalQuais - occupes,
            totalHistorique,
            avgDureeMinutes: Math.round(avgDuree._avg.dureeMinutes ?? 0),
            totalCamions,
        });
    } catch {
        res.status(500).json({ error: 'Erreur stats' });
    }
});

export default router;
