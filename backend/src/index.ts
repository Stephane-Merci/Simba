import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config';
import { creerApp } from './app';
import { prisma } from './lib/prisma';
import { brancherTempsReel } from './lib/realtime';

const httpServer = createServer(creerApp());

brancherTempsReel(
    new Server(httpServer, {
        cors: { origin: config.corsOrigin },
    }),
);

httpServer.listen(config.port, () => {
    console.log(`🚚 SIMBA backend démarré sur le port ${config.port}`);
});

async function arreter() {
    httpServer.close();
    await prisma.$disconnect();
    process.exit(0);
}
process.on('SIGTERM', arreter);
process.on('SIGINT', arreter);
