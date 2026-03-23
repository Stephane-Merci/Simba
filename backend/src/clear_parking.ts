import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const deletedCount = await prisma.parkingSection.deleteMany();
    console.log(`Deleted ${deletedCount.count} parking sections.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
