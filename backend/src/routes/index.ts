import { Router } from 'express';
import { asyncHandler } from '../lib/http';
import * as visites from '../services/visiteService';
import * as site from '../services/siteService';
import * as camions from '../services/camionService';
import * as infra from '../services/infrastructureService';
import * as s from './schemas';

/** Contrôleurs HTTP : validation de l'entrée → appel du service → réponse JSON. */
export const api = Router();

api.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Site (tableau de bord) ───────────────────────────────────────────────
api.get('/site', asyncHandler(async (_req, res) => {
    res.json(await site.etatDuSite());
}));

api.get('/stats', asyncHandler(async (req, res) => {
    const { debutJournee } = s.stats.parse(req.query);
    const minuit = new Date();
    minuit.setHours(0, 0, 0, 0);
    res.json(await site.statistiques(debutJournee ?? minuit));
}));

// ── Visites (parcours camion) ────────────────────────────────────────────
api.post('/visites', asyncHandler(async (req, res) => {
    res.status(201).json(await visites.enregistrerArrivee(s.arrivee.parse(req.body)));
}));

api.get('/visites', asyncHandler(async (req, res) => {
    res.json(await visites.historique(s.filtresHistorique.parse(req.query)));
}));

api.get('/visites/:id', asyncHandler(async (req, res) => {
    res.json(await visites.detail(req.params.id));
}));

api.patch('/visites/:id', asyncHandler(async (req, res) => {
    res.json(await visites.modifierVisite(req.params.id, s.modificationVisite.parse(req.body)));
}));

api.post('/visites/:id/deplacer', asyncHandler(async (req, res) => {
    res.json(await visites.deplacer(req.params.id, s.destination.parse(req.body)));
}));

api.post('/visites/:id/sortie', asyncHandler(async (req, res) => {
    res.json(await visites.enregistrerSortie(req.params.id, s.sortie.parse(req.body ?? {}).notes));
}));

api.delete('/visites/:id', asyncHandler(async (req, res) => {
    await visites.annulerArrivee(req.params.id);
    res.status(204).end();
}));

// ── Camions (registre) ───────────────────────────────────────────────────
api.get('/camions', asyncHandler(async (req, res) => {
    const { q, limit } = s.recherche.parse(req.query);
    res.json(await camions.rechercher(q, limit));
}));

api.post('/camions', asyncHandler(async (req, res) => {
    res.status(201).json(await camions.creer(s.camion.parse(req.body)));
}));

api.put('/camions/:id', asyncHandler(async (req, res) => {
    res.json(await camions.modifier(req.params.id, s.camion.partial().parse(req.body)));
}));

api.delete('/camions/:id', asyncHandler(async (req, res) => {
    await camions.supprimer(req.params.id);
    res.status(204).end();
}));

// ── Quais ────────────────────────────────────────────────────────────────
api.post('/quais', asyncHandler(async (req, res) => {
    res.status(201).json(await infra.creerQuai(s.quai.parse(req.body)));
}));

api.put('/quais/ordre', asyncHandler(async (req, res) => {
    await infra.reordonnerQuais(s.ordre.parse(req.body).ids);
    res.status(204).end();
}));

api.put('/quais/:id', asyncHandler(async (req, res) => {
    res.json(await infra.modifierQuai(req.params.id, s.quai.partial().parse(req.body)));
}));

api.delete('/quais/:id', asyncHandler(async (req, res) => {
    await infra.supprimerQuai(req.params.id);
    res.status(204).end();
}));

// ── Parkings ─────────────────────────────────────────────────────────────
api.post('/parkings', asyncHandler(async (req, res) => {
    res.status(201).json(await infra.creerParking(s.parking.parse(req.body)));
}));

api.put('/parkings/:id', asyncHandler(async (req, res) => {
    res.json(await infra.modifierParking(req.params.id, s.parking.partial().parse(req.body)));
}));

api.delete('/parkings/:id', asyncHandler(async (req, res) => {
    await infra.supprimerParking(req.params.id);
    res.status(204).end();
}));
