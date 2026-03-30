import { query } from "../db/postgres.js";
import type { StatutTicket } from "@shared/types/statutsTicket.js";
import type { commentaireItem, ticketResumeTechnicien, ticketDetailTechnicien } from "@shared/types/api/technicienApi.js";

// --- Récupération tickets ---

interface DbTicketRow {
    id_ticket: number;
    sujet: string;
    contenu: string;
    statut: StatutTicket;
    date_creation: string;
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
        username_auteur: ticket.username_auteur,
        commentaires: commentairesResult.rows.map(versCommentaire)
    };
}

// Changer le statut d'un ticket
export async function changerStatutTicket(
    idTicket: number,
    statut: StatutTicket
): Promise<"success" | "introuvable"> {
    const result = await query<{ id_ticket: number }>(
        "UPDATE ticket SET statut = $1 WHERE id_ticket = $2 RETURNING id_ticket",
        [statut, idTicket]
    );
    return result.rows.length === 0 ? "introuvable" : "success";
}

// Ajouter un commentaire (technicien ou utilisateur)
export async function ajouterCommentaire(
    idTicket: number,
    idPersonne: number,
    contenu: string
): Promise<"success" | "ticket_introuvable"> {
    // Vérifier que le ticket existe
    const ticketExiste = await query<{ id_ticket: number }>(
        "SELECT id_ticket FROM ticket WHERE id_ticket = $1 LIMIT 1",
        [idTicket]
    );
    if (ticketExiste.rows.length === 0) return "ticket_introuvable";

    await query(
        "INSERT INTO commentaire (contenu, id_ticket, id_personne) VALUES ($1, $2, $3)",
        [contenu.trim(), idTicket, idPersonne]
    );
    return "success";
}
