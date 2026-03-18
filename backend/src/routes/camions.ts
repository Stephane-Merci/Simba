import express from 'express';
import { prisma, io } from '../index';
import { z } from 'zod';

const router = express.Router();

const camionSchema = z.object({
    matricule: z.string().min(1),
    transporteur: z.string().optional(),
    type: z.string().optional(),
});

// GET all camions
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const camions = await prisma.camion.findMany({
            where: status ? { status: status as string } : undefined,
            orderBy: { createdAt: 'desc' },
        });
        res.json(camions);
    } catch {
        res.status(500).json({ error: 'Erreur lors de la récupération des camions' });
    }
});

// POST create camion
router.post('/', async (req, res) => {
    try {
        const data = camionSchema.parse(req.body);
        const camion = await prisma.camion.create({
            data,
        });
        io.emit('camions-updated', { room: 'main' });
        res.status(201).json(camion);
    } catch (e: any) {
        if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
        if (e.code === 'P2002') return res.status(400).json({ error: 'Matricule déjà utilisé' });
        res.status(500).json({ error: 'Erreur lors de la création du camion' });
    }
});

// PUT update camion
router.put('/:id', async (req, res) => {
    try {
        const data = camionSchema.partial().parse(req.body);
        const camion = await prisma.camion.update({
            where: { id: req.params.id },
            data,
        });
        io.emit('camions-updated', { room: 'main' });
        res.json(camion);
    } catch (e: any) {
        if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
        res.status(500).json({ error: 'Erreur lors de la mise à jour du camion' });
    }
});

// DELETE camion
router.delete('/:id', async (req, res) => {
    try {
        await prisma.camion.delete({
            where: { id: req.params.id },
        });
        io.emit('camions-updated', { room: 'main' });
        res.status(204).send();
    } catch {
        res.status(500).json({ error: 'Erreur lors de la suppression du camion' });
    }
});

export default router;
