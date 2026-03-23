import express from 'express';
import { prisma, io } from '../index';
import { z } from 'zod';

const router = express.Router();

const quaiSchema = z.object({
    nom: z.string().min(1),
    description: z.string().optional(),
    ordre: z.number().optional(),
});

// GET all quais with active assignment
router.get('/', async (_req, res) => {
    try {
        const quais = await prisma.quai.findMany({
            where: { isActive: true },
            include: {
                assignments: {
                    where: { depart: null },
                    include: { camion: true },
                    orderBy: { arrivee: 'desc' },
                    take: 1,
                },
            },
            orderBy: { ordre: 'asc' },
        });
        res.json(quais);
    } catch {
        res.status(500).json({ error: 'Erreur lors de la récupération des quais' });
    }
});

// POST create quai
router.post('/', async (req, res) => {
    try {
        const data = quaiSchema.parse(req.body);
        const count = await prisma.quai.count();
        const quai = await prisma.quai.create({
            data: { ...data, ordre: data.ordre ?? count },
            include: { assignments: true },
        });
        io.emit('quais-updated', { room: 'main' });
        res.status(201).json(quai);
    } catch (e: any) {
        if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
        res.status(500).json({ error: 'Erreur lors de la création du quai' });
    }
});

// PUT update quai
router.put('/:id', async (req, res) => {
    try {
        const data = quaiSchema.partial().parse(req.body);
        const quai = await prisma.quai.update({
            where: { id: req.params.id },
            data,
            include: { assignments: { where: { depart: null }, take: 1 } },
        });
        io.emit('quais-updated', { room: 'main' });
        res.json(quai);
    } catch (e: any) {
        if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
        res.status(500).json({ error: 'Erreur lors de la mise à jour du quai' });
    }
});

// DELETE (soft delete) quai
router.delete('/:id', async (req, res) => {
    try {
        // Check if quai has an active assignment
        const active = await prisma.assignment.findFirst({
            where: { quaiId: req.params.id, depart: null },
        });
        if (active) {
            return res.status(400).json({ error: 'Ce quai a un camion en cours. Libérez-le avant de supprimer.' });
        }
        await prisma.quai.update({
            where: { id: req.params.id },
            data: { isActive: false },
        });
        io.emit('quais-updated', { room: 'main' });
        res.status(204).send();
    } catch {
        res.status(500).json({ error: 'Erreur lors de la suppression du quai' });
    }
});

// PUT reorder quais
router.put('/reorder/ordre', async (req, res) => {
    try {
        const { orderedIds } = req.body as { orderedIds: string[] };
        await Promise.all(
            orderedIds.map((id, index) =>
                prisma.quai.update({ where: { id }, data: { ordre: index } })
            )
        );
        io.emit('quais-updated', { room: 'main' });
        res.json({ ok: true });
    } catch {
        res.status(500).json({ error: 'Erreur lors du réordonnancement' });
    }
});

export default router;
