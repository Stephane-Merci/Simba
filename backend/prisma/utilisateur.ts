import { PrismaClient } from '@prisma/client';
import { hacherMotDePasse } from '../src/lib/auth';

/**
 * Crée un compte ou réinitialise son mot de passe (en cas d'oubli) :
 *   npm run utilisateur -- <identifiant> <mot de passe> [nom affiché]
 */
const prisma = new PrismaClient();

async function main() {
    const [identifiantBrut, motDePasse, nom = 'Responsable'] = process.argv.slice(2);
    if (!identifiantBrut || !motDePasse || motDePasse.length < 8) {
        console.error('Usage : npm run utilisateur -- <identifiant> <mot de passe (8 caractères min.)> [nom]');
        process.exit(1);
    }
    const identifiant = identifiantBrut.trim().toLowerCase();
    const motDePasseHash = await hacherMotDePasse(motDePasse);
    await prisma.utilisateur.upsert({
        where: { identifiant },
        create: { identifiant, nom, motDePasseHash },
        update: { motDePasseHash, motDePasseModifieLe: new Date() },
    });
    console.log(`Compte « ${identifiant} » enregistré.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
