import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En développement, /api et /socket.io sont redirigés vers le backend :
// aucune variable d'environnement n'est nécessaire en local.
const backend = process.env.BACKEND_URL ?? 'http://localhost:5001';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3001,
        proxy: {
            '/api': backend,
            '/socket.io': { target: backend, ws: true },
        },
    },
});
