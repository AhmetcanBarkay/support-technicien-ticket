import {
    creerTechnicien,
    genererMotDePasse,
    getPersonneParIdentifiant,
    getPersonnesParRole,
    supprimerPersonneParId
} from "./personneService.js";

// Crée un compte technicien avec un mot de passe généré automatiquement
export async function creerCompteTechnicien(
    identifiant: string
): Promise<{ status: "success" | "user_exists" | "error"; id?: number; generatedPassword?: string }> {
    const motDePasseGenere = genererMotDePasse(12);
    const resultat = await creerTechnicien(identifiant, motDePasseGenere);

    if (resultat.status !== "success" || !resultat.personne) {
        return { status: resultat.status === "user_exists" ? "user_exists" : "error" };
    }

    return {
        status: "success",
        id: resultat.personne.id,
        generatedPassword: motDePasseGenere
    };
}

// Supprime un compte technicien (vérifie le rôle avant suppression)
export async function supprimerCompteTechnicien(
    identifiant: string
): Promise<"success" | "not_found" | "mauvais_role"> {
    const personne = await getPersonneParIdentifiant(identifiant);
    if (!personne) return "not_found";
    if (personne.role !== "technicien") return "mauvais_role";
    await supprimerPersonneParId(personne.id);
    return "success";
}

// Liste tous les techniciens
export async function listerTechniciens(): Promise<Array<{ id: number; username: string; date_creation: string }>> {
    const techniciens = await getPersonnesParRole("technicien");
    return techniciens.map(t => ({
        id: t.id,
        username: t.username,
        date_creation: t.date_creation.toISOString()
    }));
}
