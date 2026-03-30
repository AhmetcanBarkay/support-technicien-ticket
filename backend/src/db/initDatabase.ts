import bcrypt from "bcrypt";
import { pool, query } from "./postgres.js";
import { generateUniqueToken } from "../services/personneService.js";
import { getBcryptSaltRounds } from "../constants/securite.js";

// Création du schéma complet adapté au MCD gestion de tickets

async function creerSchema(): Promise<void> {
    // Table personne — base commune des comptes
    await query(`
CREATE TABLE IF NOT EXISTS personne (
    id_personne         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    identifiant         VARCHAR(50) NOT NULL UNIQUE,
    mdpbcrypt           VARCHAR(60) NOT NULL,
    token_personne      VARCHAR(50) NOT NULL UNIQUE,
    role                VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'technicien', 'utilisateur')),
    date_creation       TIMESTAMP NOT NULL DEFAULT NOW()
);
`);

    // Table ticket — demandes de support créées par les utilisateurs
    await query(`
CREATE TABLE IF NOT EXISTS ticket (
    id_ticket       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sujet           VARCHAR(200) NOT NULL,
    contenu         TEXT NOT NULL,
    statut          VARCHAR(20) NOT NULL DEFAULT 'en_attente'
                    CHECK (statut IN ('en_attente', 'en_cours', 'resolu', 'non_resolu')),
    date_creation   TIMESTAMP NOT NULL DEFAULT NOW(),
    id_utilisateur  INTEGER NOT NULL REFERENCES personne(id_personne) ON DELETE CASCADE
);
`);

    // Table commentaire — historique des échanges sur un ticket
    await query(`
CREATE TABLE IF NOT EXISTS commentaire (
    id_commentaire  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    contenu         TEXT NOT NULL,
    date_envoi      TIMESTAMP NOT NULL DEFAULT NOW(),
    id_ticket       INTEGER NOT NULL REFERENCES ticket(id_ticket) ON DELETE CASCADE,
    id_personne     INTEGER NOT NULL REFERENCES personne(id_personne) ON DELETE CASCADE
);
`);
}

// Garantit que le compte admin existe et est à jour avec les variables d'environnement
async function garantirAdmin(): Promise<void> {
    const adminUsername = process.env.ADMIN_USERNAME?.trim() || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();

    if (!adminPassword) {
        throw new Error("ADMIN_PASSWORD manquant dans .env");
    }

    const existing = await query<{
        id_personne: number;
        mdpbcrypt: string;
        token_personne: string;
        role: string;
    }>(
        "SELECT id_personne, mdpbcrypt, token_personne, role FROM personne WHERE identifiant = $1 LIMIT 1",
        [adminUsername]
    );

    if (existing.rows.length === 0) {
        const hash = await bcrypt.hash(adminPassword, getBcryptSaltRounds());
        const token = await generateUniqueToken(50);
        await query(
            "INSERT INTO personne (identifiant, mdpbcrypt, token_personne, role) VALUES ($1, $2, $3, 'admin')",
            [adminUsername, hash, token]
        );
        console.log(`Compte admin créé : ${adminUsername}`);
        return;
    }

    const admin = existing.rows[0];
    const motDePasseValide = await bcrypt.compare(adminPassword, admin.mdpbcrypt);

    if (admin.role !== "admin" || !motDePasseValide) {
        const nouveauHash = !motDePasseValide
            ? await bcrypt.hash(adminPassword, getBcryptSaltRounds())
            : admin.mdpbcrypt;
        await query(
            "UPDATE personne SET role = 'admin', mdpbcrypt = $1 WHERE id_personne = $2",
            [nouveauHash, admin.id_personne]
        );
        console.log(`Compte admin mis à jour : ${adminUsername}`);
    }
}

export async function initDatabase(): Promise<void> {
    await creerSchema();
    await garantirAdmin();
}

export async function closeDatabase(): Promise<void> {
    await pool.end();
}
