import bcrypt from "bcrypt";
import crypto from "crypto";
import type Personne from "../models/personne.js";
import type { Role } from "@shared/types/roles.js";
import { getBcryptSaltRounds } from "../constants/securite.js";
import { query } from "../db/postgres.js";

// --- Mapping BDD → modèle ---

interface DbPersonneRow {
    id_personne: number;
    identifiant: string;
    mdpbcrypt: string;
    token_personne: string;
    role: Role;
    date_creation: string;
}

function versPersonne(row: DbPersonneRow): Personne {
    return {
        id: row.id_personne,
        username: row.identifiant,
        hashedPassword: row.mdpbcrypt,
        token: row.token_personne,
        role: row.role,
        date_creation: new Date(row.date_creation)
    };
}

// --- Génération de token unique ---

export function genererToken(longueur: number = 50): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < longueur; i++) {
        token += chars.charAt(crypto.randomInt(0, chars.length));
    }
    return token;
}

export async function generateUniqueToken(longueur: number = 50): Promise<string> {
    for (let i = 0; i < 20; i++) {
        const token = genererToken(longueur);
        const existing = await query<{ id_personne: number }>(
            "SELECT id_personne FROM personne WHERE token_personne = $1 LIMIT 1",
            [token]
        );
        if (existing.rows.length === 0) return token;
    }
    throw new Error("Impossible de générer un token unique");
}

// --- Génération de mot de passe ---

export function genererMotDePasse(longueur: number = 12): string {
    const majuscules = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const minuscules = "abcdefghijklmnopqrstuvwxyz";
    const chiffres = "0123456789";
    const speciaux = "#!?*";
    const tous = majuscules + minuscules + chiffres + speciaux;

    const chars: string[] = [
        majuscules.charAt(crypto.randomInt(0, majuscules.length)),
        minuscules.charAt(crypto.randomInt(0, minuscules.length)),
        chiffres.charAt(crypto.randomInt(0, chiffres.length)),
        speciaux.charAt(crypto.randomInt(0, speciaux.length))
    ];

    for (let i = chars.length; i < longueur; i++) {
        chars.push(tous.charAt(crypto.randomInt(0, tous.length)));
    }

    // Mélange aléatoire
    for (let i = chars.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join("");
}

// --- Recherche personne ---

export async function getPersonneParToken(token: string): Promise<Personne | undefined> {
    const result = await query<DbPersonneRow>(
        "SELECT id_personne, identifiant, mdpbcrypt, token_personne, role, date_creation FROM personne WHERE token_personne = $1 LIMIT 1",
        [token]
    );
    if (result.rows.length === 0) return undefined;
    return versPersonne(result.rows[0]);
}

export async function getPersonneParId(id: number): Promise<Personne | undefined> {
    const result = await query<DbPersonneRow>(
        "SELECT id_personne, identifiant, mdpbcrypt, token_personne, role, date_creation FROM personne WHERE id_personne = $1 LIMIT 1",
        [id]
    );
    if (result.rows.length === 0) return undefined;
    return versPersonne(result.rows[0]);
}

export async function getPersonneParIdentifiant(identifiant: string): Promise<Personne | undefined> {
    const result = await query<DbPersonneRow>(
        "SELECT id_personne, identifiant, mdpbcrypt, token_personne, role, date_creation FROM personne WHERE LOWER(identifiant) = $1 LIMIT 1",
        [identifiant.trim().toLowerCase()]
    );
    if (result.rows.length === 0) return undefined;
    return versPersonne(result.rows[0]);
}

export async function getPersonneParLogin(identifiant: string, motDePasse: string): Promise<Personne | undefined> {
    const personne = await getPersonneParIdentifiant(identifiant);
    if (!personne) return undefined;
    const motDePasseValide = await bcrypt.compare(motDePasse, personne.hashedPassword);
    return motDePasseValide ? personne : undefined;
}

// --- Création personne ---

interface ResultatCreationPersonne {
    status: "success" | "user_exists" | "error";
    personne?: Personne;
}

export async function creerPersonne(
    identifiant: string,
    motDePasse: string,
    role: Role
): Promise<ResultatCreationPersonne> {
    if (await getPersonneParIdentifiant(identifiant)) {
        return { status: "user_exists" };
    }

    try {
        const hash = await bcrypt.hash(motDePasse, getBcryptSaltRounds());

        // Double-vérification contre les races conditions
        if (await getPersonneParIdentifiant(identifiant)) {
            return { status: "user_exists" };
        }

        const token = await generateUniqueToken(50);
        const inserted = await query<DbPersonneRow>(
            "INSERT INTO personne (identifiant, mdpbcrypt, token_personne, role) VALUES ($1, $2, $3, $4) RETURNING id_personne, identifiant, mdpbcrypt, token_personne, role, date_creation",
            [identifiant.trim(), hash, token, role]
        );

        return { status: "success", personne: versPersonne(inserted.rows[0]) };
    } catch {
        return { status: "error" };
    }
}

export function creerUtilisateur(identifiant: string, motDePasse: string): Promise<ResultatCreationPersonne> {
    return creerPersonne(identifiant, motDePasse, "utilisateur");
}

export function creerTechnicien(identifiant: string, motDePasse: string): Promise<ResultatCreationPersonne> {
    return creerPersonne(identifiant, motDePasse, "technicien");
}

// --- Suppression personne ---

export async function supprimerPersonneParId(id: number): Promise<"success" | "not_found"> {
    const result = await query<{ id_personne: number }>(
        "DELETE FROM personne WHERE id_personne = $1 RETURNING id_personne",
        [id]
    );
    return result.rows.length === 0 ? "not_found" : "success";
}

// --- Liste par rôle ---

export async function getPersonnesParRole(role: Role): Promise<Personne[]> {
    const result = await query<DbPersonneRow>(
        "SELECT id_personne, identifiant, mdpbcrypt, token_personne, role, date_creation FROM personne WHERE role = $1 ORDER BY id_personne ASC",
        [role]
    );
    return result.rows.map(versPersonne);
}

// --- Changement de mot de passe ---

interface ResultatChangementMotDePasse {
    status: "success" | "not_found" | "mot_de_passe_actuel_invalide" | "meme_mot_de_passe" | "error";
    token?: string;
}

export async function changerMotDePasse(
    idPersonne: number,
    motDePasseActuel: string,
    nouveauMotDePasse: string
): Promise<ResultatChangementMotDePasse> {
    const personne = await getPersonneParId(idPersonne);
    if (!personne) return { status: "not_found" };

    const actuelValide = await bcrypt.compare(motDePasseActuel, personne.hashedPassword);
    if (!actuelValide) return { status: "mot_de_passe_actuel_invalide" };

    const memeMdp = await bcrypt.compare(nouveauMotDePasse, personne.hashedPassword);
    if (memeMdp) return { status: "meme_mot_de_passe" };

    try {
        const hash = await bcrypt.hash(nouveauMotDePasse, getBcryptSaltRounds());
        const token = await generateUniqueToken(50);
        await query(
            "UPDATE personne SET mdpbcrypt = $1, token_personne = $2 WHERE id_personne = $3",
            [hash, token, idPersonne]
        );
        return { status: "success", token };
    } catch {
        return { status: "error" };
    }
}
