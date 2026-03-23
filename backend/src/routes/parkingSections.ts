import express from 'express';
import { prisma, io } from '../index';
import { z } from 'zod';

const router = express.Router();

const parkingSchema = z.object({
    nom: z.string().min(1),
    capacite: z.number().min(1).optional(),
    ordre: z.number().optional(),
});

// GET all parking sections
router.get('/', async (_req, res) => {
    try {
        const sections = await prisma.parkingSection.findMany({
            include: { camions: true },
            orderBy: { ordre: 'asc' },
        });
        res.json(sections);
    } catch {
        res.status(500).json({ error: 'Erreur lors de la récupération des sections' });
    }
});

// POST create section
router.post('/', async (req, res) => {
    try {
        const data = parkingSchema.parse(req.body);
        const section = await prisma.parkingSection.create({ data });
        io.emit('parking-updated', { room: 'main' });
        res.status(201).json(section);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// PUT update section
router.put('/:id', async (req, res) => {
    try {
        const data = parkingSchema.partial().parse(req.body);
        const section = await prisma.parkingSection.update({
            where: { id: req.params.id },
            data,
        });
        io.emit('parking-updated', { room: 'main' });
        res.json(section);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// DELETE section
router.delete('/:id', async (req, res) => {
    try {
        await prisma.parkingSection.delete({ where: { id: req.params.id } });
        io.emit('parking-updated', { room: 'main' });
        res.status(204).send();
    } catch {
        res.status(500).json({ error: 'Erreur suppression' });
    }
});

export default router;
