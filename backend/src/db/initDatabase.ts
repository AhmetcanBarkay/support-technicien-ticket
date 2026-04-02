import bcrypt from "bcrypt";
import { pool, query } from "./postgres.js";
import { generateUniqueToken } from "../services/personneService.js";
import { getBcryptSaltRounds } from "../constants/securite.js";

// Création du schéma complet adapté au MCD support technicien ticket

async function creerSchema(): Promise<void> {

    // Table personne-base commune des comptes
    await query(`
CREATE TABLE IF NOT EXISTS personne (
    id_personne         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    identifiant         VARCHAR(50) NOT NULL UNIQUE,
    mdpbcrypt           VARCHAR(60) NOT NULL,
    token               VARCHAR(50) NOT NULL UNIQUE,
    role                VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'technicien', 'utilisateur')),
    date_creation       TIMESTAMP NOT NULL DEFAULT NOW()
);
`);

    await query(`
CREATE OR REPLACE FUNCTION interdire_modification_role_personne()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Modification du role interdite';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`);

    await query(`
DROP TRIGGER IF EXISTS trig_interdire_modification_role_personne ON personne;
CREATE TRIGGER trig_interdire_modification_role_personne
BEFORE UPDATE OF role ON personne
FOR EACH ROW
EXECUTE FUNCTION interdire_modification_role_personne();
`);

    // Table ticket-demandes de support créées par les utilisateurs
    await query(`
CREATE TABLE IF NOT EXISTS ticket (
    id_ticket       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sujet           VARCHAR(200) NOT NULL,
    contenu         TEXT NOT NULL,
    statut          VARCHAR(20) NOT NULL DEFAULT 'en_attente'
                    CHECK (statut IN ('en_attente', 'en_cours', 'resolu', 'non_resolu')),
    date_creation   TIMESTAMP NOT NULL DEFAULT NOW(),
    date_dernier_action TIMESTAMP NOT NULL DEFAULT NOW(),
    ferme           BOOLEAN NOT NULL DEFAULT FALSE,
    id_utilisateur  INTEGER NOT NULL REFERENCES personne(id_personne) ON DELETE CASCADE
);
`);

    // Migration de fermee a ferme 
    try {
        await query("ALTER TABLE ticket RENAME COLUMN fermee TO ferme;");
    } catch (error: unknown) {

    };

    await query(`
CREATE TABLE IF NOT EXISTS commentaire (
    id_commentaire  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    contenu         TEXT NOT NULL,
    date_envoi      TIMESTAMP NOT NULL DEFAULT NOW(),
    id_ticket       INTEGER NOT NULL REFERENCES ticket(id_ticket) ON DELETE CASCADE,
    id_personne     INTEGER NOT NULL REFERENCES personne(id_personne) ON DELETE CASCADE
);
`);

    await query(`
CREATE OR REPLACE FUNCTION nettoyer_tickets_fermes()
RETURNS INTEGER AS $$
DECLARE
    nb_supprimes INTEGER;
BEGIN
    DELETE FROM ticket
    WHERE ferme = TRUE
      AND date_dernier_action <= NOW() - INTERVAL '7 days';

    GET DIAGNOSTICS nb_supprimes = ROW_COUNT;
    RETURN nb_supprimes;
END;
$$ LANGUAGE plpgsql;
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
        token: string;
        role: string;
    }>(
        "SELECT id_personne, mdpbcrypt, token, role FROM personne WHERE identifiant = $1 LIMIT 1",
        [adminUsername]
    );

    if (existing.rows.length === 0) {
        const hash = await bcrypt.hash(adminPassword, getBcryptSaltRounds());
        const token = await generateUniqueToken(50);
        await query(
            "INSERT INTO personne (identifiant, mdpbcrypt, token, role) VALUES ($1, $2, $3, 'admin')",
            [adminUsername, hash, token]
        );
        console.log(`Compte admin créé : ${adminUsername}`);
        return;
    }

    const admin = existing.rows[0];

    if (admin.role !== "admin") {
        throw new Error(`Le compte ${adminUsername} existe mais n'a pas le role admin`);
    }

    const motDePasseValide = await bcrypt.compare(adminPassword, admin.mdpbcrypt);

    if (!motDePasseValide) {
        const nouveauHash = await bcrypt.hash(adminPassword, getBcryptSaltRounds());
        await query(
            "UPDATE personne SET mdpbcrypt = $1 WHERE id_personne = $2",
            [nouveauHash, admin.id_personne]
        );
        console.log(`Compte admin mis à jour : ${adminUsername}`);
    }
}

export async function initDatabase(): Promise<void> {
    await creerSchema();
    await garantirAdmin();
}

export async function nettoyerTicketsFermes(): Promise<number> {
    const result = await query<{ nb: number }>("SELECT nettoyer_tickets_fermes() AS nb");
    return Number(result.rows[0]?.nb ?? 0);
}

export async function closeDatabase(): Promise<void> {
    await pool.end();
}
