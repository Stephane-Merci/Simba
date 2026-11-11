import { PrismaClient } from '@prisma/client';

/** Données de départ (uniquement si la base est vide) : `npm run db:seed`. */
const prisma = new PrismaClient();

async function main() {
    if ((await prisma.quai.count()) === 0) {
        await prisma.quai.createMany({
            data: Array.from({ length: 8 }, (_, i) => ({ nom: `Quai ${i + 1}`, ordre: i })),
        });
        console.log('8 quais créés');
    }
    if ((await prisma.parkingSection.count()) === 0) {
        await prisma.parkingSection.createMany({
            data: [
                { nom: 'Parking Nord', capacite: 12, ordre: 0 },
                { nom: 'Parking Sud', capacite: 8, ordre: 1 },
            ],
        });
        console.log('2 parkings créés');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
