import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { api } from './routes';
import { gestionErreurs } from './lib/http';

/** Construit l'application Express (sans démarrer le serveur). */
export function creerApp() {
    const app = express();
    app.disable('x-powered-by');
    app.use(cors({ origin: config.corsOrigin }));
    app.use(express.json({ limit: '100kb' }));

    app.use('/api', api);
    app.use('/api', (_req, res) => {
        res.status(404).json({ error: 'Route introuvable.' });
    });

    // Optionnel : servir le frontend compilé depuis le même service.
    if (config.staticDir && fs.existsSync(config.staticDir)) {
        const dir = path.resolve(config.staticDir);
        app.use(express.static(dir));
        app.get('*', (_req, res) => res.sendFile(path.join(dir, 'index.html')));
    }

    app.use(gestionErreurs);
    return app;
}
