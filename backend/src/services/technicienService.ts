import { pool, query } from "../db/postgres.js";
import type { StatutTicket } from "@shared/types/statutsTicket.js";
import type { commentaireItem, ticketResumeTechnicien, ticketDetailTechnicien } from "@shared/types/api/technicienApi.js";

// --- Récupération tickets ---

interface DbTicketRow {
    id_ticket: number;
    sujet: string;
    contenu: string;
    statut: StatutTicket;
    date_creation: string;
    date_dernier_action: string;
    ferme: boolean;
    username_auteur: string;
}

interface DbCommentaireRow {
    id_commentaire: number;
    contenu: string;
    date_envoi: string;
    username_auteur: string;
    role_auteur: string;
}

function versResumeTicket(row: DbTicketRow): ticketResumeTechnicien {
    return {
        id: row.id_ticket,
        sujet: row.sujet,
        statut: row.statut,
        date_creation: row.date_creation,
        date_dernier_action: row.date_dernier_action,
        ferme: row.ferme,
        username_auteur: row.username_auteur
    };
}

function versCommentaire(row: DbCommentaireRow): commentaireItem {
    return {
        id: row.id_commentaire,
        contenu: row.contenu,
        date_envoi: row.date_envoi,
        username_auteur: row.username_auteur,
        role_auteur: row.role_auteur
    };
}

// Tous les tickets (visible technicien)
export async function listerTousLesTickets(): Promise<ticketResumeTechnicien[]> {
    const result = await query<DbTicketRow>(`
        SELECT
            t.id_ticket,
            t.sujet,
            t.contenu,
            t.statut,
            t.date_creation,
            t.date_dernier_action,
            t.ferme AS ferme,
            p.identifiant AS username_auteur
        FROM ticket t
        JOIN personne p ON p.id_personne = t.id_utilisateur
        ORDER BY t.date_creation DESC
    `);
    return result.rows.map(versResumeTicket);
}

// Détail d'un ticket avec ses commentaires (visible technicien)
export async function getDetailTicketTechnicien(
    idTicket: number
): Promise<ticketDetailTechnicien | null> {
    const ticketResult = await query<DbTicketRow>(`
        SELECT
            t.id_ticket,
            t.sujet,
            t.contenu,
            t.statut,
            t.date_creation,
            t.date_dernier_action,
            t.ferme AS ferme,
            p.identifiant AS username_auteur
        FROM ticket t
        JOIN personne p ON p.id_personne = t.id_utilisateur
        WHERE t.id_ticket = $1
        LIMIT 1
    `, [idTicket]);

    if (ticketResult.rows.length === 0) return null;
    const ticket = ticketResult.rows[0];

    const commentairesResult = await query<DbCommentaireRow>(`
        SELECT
            c.id_commentaire,
            c.contenu,
            c.date_envoi,
            p.identifiant AS username_auteur,
            p.role AS role_auteur
        FROM commentaire c
        JOIN personne p ON p.id_personne = c.id_personne
        WHERE c.id_ticket = $1
        ORDER BY c.date_envoi ASC
    `, [idTicket]);

    return {
        id: ticket.id_ticket,
        sujet: ticket.sujet,
        contenu: ticket.contenu,
        statut: ticket.statut,
        date_creation: ticket.date_creation,
        date_dernier_action: ticket.date_dernier_action,
        ferme: ticket.ferme,
        username_auteur: ticket.username_auteur,
        commentaires: commentairesResult.rows.map(versCommentaire)
    };
}

// Changer le statut d'un ticket
export async function changerStatutTicket(
    idTicket: number,
    statut: StatutTicket
): Promise<"success" | "introuvable" | "ticket_ferme"> {
    const result = await query<{ id_ticket: number }>(
        "UPDATE ticket SET statut = $1, date_dernier_action = NOW() WHERE id_ticket = $2 AND ferme = FALSE RETURNING id_ticket",
        [statut, idTicket]
    );

    if (result.rows.length > 0) return "success";

    const etat = await query<{ ferme: boolean }>(
        "SELECT ferme AS ferme FROM ticket WHERE id_ticket = $1 LIMIT 1",
        [idTicket]
    );

    if (etat.rows.length === 0) return "introuvable";
    if (etat.rows[0].ferme) return "ticket_ferme";
    return "introuvable";
}

// Ajouter un commentaire (technicien ou utilisateur)
export async function ajouterCommentaire(
    idTicket: number,
    idPersonne: number,
    contenu: string
): Promise<"success" | "ticket_introuvable" | "ticket_ferme"> {
    // Vérifier que le ticket existe
    const ticketExiste = await query<{ id_ticket: number; ferme: boolean }>(
        "SELECT id_ticket, ferme AS ferme FROM ticket WHERE id_ticket = $1 LIMIT 1",
        [idTicket]
    );
    if (ticketExiste.rows.length === 0) return "ticket_introuvable";
    if (ticketExiste.rows[0].ferme) return "ticket_ferme";

    await query(
        "INSERT INTO commentaire (contenu, id_ticket, id_personne) VALUES ($1, $2, $3)",
        [contenu.trim(), idTicket, idPersonne]
    );

    await query(
        "UPDATE ticket SET date_dernier_action = NOW() WHERE id_ticket = $1",
        [idTicket]
    );

    return "success";
}

export async function fermerTicket(
    idTicket: number,
    idPersonne: number
): Promise<"success" | "ticket_introuvable" | "deja_ferme"> {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const ticket = await client.query<{ ferme: boolean }>(
            "SELECT ferme AS ferme FROM ticket WHERE id_ticket = $1 LIMIT 1 FOR UPDATE",
            [idTicket]
        );

        if (ticket.rows.length === 0) {
            await client.query("ROLLBACK");
            return "ticket_introuvable";
        }

        if (ticket.rows[0].ferme) {
            await client.query("ROLLBACK");
            return "deja_ferme";
        }

        await client.query(
            "UPDATE ticket SET ferme = TRUE, date_dernier_action = NOW() WHERE id_ticket = $1",
            [idTicket]
        );

        await client.query(
            "INSERT INTO commentaire (contenu, id_ticket, id_personne) VALUES ($1, $2, $3)",
            ["J'ai fermé ce ticket", idTicket, idPersonne]
        );

        await client.query("COMMIT");
        return "success";
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}
