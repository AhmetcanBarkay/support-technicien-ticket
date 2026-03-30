type ServicePersonne = {
    getPersonneParIdentifiant: (identifiant: string) => Promise<{ id: number } | undefined>;
    supprimerPersonneParId: (id: number) => Promise<unknown>;
};

export function genererNomUnique(prefix: string, maxLength: number = 45): string {
    const suffix = `${Date.now().toString(36)}_${Math.floor(Math.random() * 100000).toString(36)}`;
    const trimmedPrefix = prefix.slice(0, Math.max(1, maxLength - suffix.length - 1));
    return `${trimmedPrefix}_${suffix}`;
}

export async function nettoyerPersonneParNom(service: ServicePersonne, identifiant: string): Promise<void> {
    const existing = await service.getPersonneParIdentifiant(identifiant);
    if (existing) {
        await service.supprimerPersonneParId(existing.id).catch(() => undefined);
    }
}
