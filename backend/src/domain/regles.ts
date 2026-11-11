/** Règles métier pures (sans base de données), faciles à tester. */

/**
 * Normalise un matricule saisi à l'accueil pour retrouver un camion déjà venu :
 * "ab 123  cd" et "AB-123-CD" désignent le même véhicule.
 */
export function normaliserMatricule(saisie: string): string {
    return saisie
        .trim()
        .toUpperCase()
        .replace(/[\s\-_.]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Clé de comparaison sans séparateurs : "EE555EE", "ee-555-ee" et "EE 555 EE"
 * doivent tous retrouver le même camion.
 */
export function cleMatricule(saisie: string): string {
    return saisie.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function pluriel(n: number, singulier: string, plurielForme = `${singulier}s`): string {
    return `${n} ${n > 1 ? plurielForme : singulier}`;
}

export function minutesEntre(debut: Date, fin: Date): number {
    return Math.max(0, Math.round((fin.getTime() - debut.getTime()) / 60000));
}

/** Texte optionnel : chaîne vide → null. */
export function texteOuNull(valeur: string | null | undefined): string | null {
    const v = valeur?.trim();
    return v ? v : null;
}
