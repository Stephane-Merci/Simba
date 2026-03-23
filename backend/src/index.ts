import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import quaisRouter from './routes/quais';
import assignmentsRouter from './routes/assignments';
import camionsRouter from './routes/camions';
import parkingSectionsRouter from './routes/parkingSections';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003'
].filter(Boolean) as string[];

export const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
});

export const prisma = new PrismaClient();

app.use(cors({ origin: allowedOrigins }));

app.use(express.json());

app.use('/api/quais', quaisRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/camions', camionsRouter);
app.use('/api/parking-sections', parkingSectionsRouter);


app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
    socket.on('join-room', (room: string) => {
        socket.join(room);
    });
});

const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
    console.log(`🚚 Simba backend démarré sur le port ${PORT}`);
});
