import { after, before } from "node:test";
import dotenv from "dotenv";

type ServicePersonne = {
    getPersonneParIdentifiant: (identifiant: string) => Promise<{ id: number } | undefined>;
    supprimerPersonneParId: (id: number) => Promise<unknown>;
};

type DbModule = typeof import("../../db/initDatabase.js");

export function configurerTestsAvecServices<T>(chargerServices: () => Promise<T>): () => T {
    dotenv.config({ path: "../.env" });

    let db: DbModule;
    let services: T;

    before(async () => {
        db = await import("../../db/initDatabase.js");
        services = await chargerServices();
        await db.initDatabase();
    });

    after(async () => {
        await db.closeDatabase();
    });

    return () => services;
}

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

export async function capturerMessageErreur(action: () => Promise<unknown>): Promise<string> {
    try {
        await action();
        return "";
    } catch (err) {
        return String((err as { message?: string })?.message ?? "");
    }
}
