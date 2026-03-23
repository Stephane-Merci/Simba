import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const sections = await prisma.parkingSection.findMany();
    console.log(JSON.stringify(sections));
}
main().catch(console.error).finally(() => prisma.$disconnect());
