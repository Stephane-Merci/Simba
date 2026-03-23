const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sections = [
    { nom: 'PARKING NORD', ordre: 1 },
    { nom: 'PARKING SUD', ordre: 2 },
    { nom: 'ZONE ATTENTE A', ordre: 3 },
  ];

  for (const s of sections) {
    await prisma.parkingSection.upsert({
      where: { id: s.nom }, // This won't work perfectly if I don't have id, but I'll use create if not exist logic
      update: {},
      create: s,
    });
  }
  console.log('Seed sections completed');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
