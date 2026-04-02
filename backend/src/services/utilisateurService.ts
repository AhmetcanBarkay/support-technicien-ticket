import { query } from "../db/postgres.js";
import type { StatutTicket } from "@shared/types/statutsTicket.js";
import type { ticketResumeUtilisateur, ticketDetailUtilisateur } from "@shared/types/api/utilisateurApi.js";
import type { commentaireItem } from "@shared/types/api/technicienApi.js";
import { ajouterCommentaire, fermerTicket } from "./technicienService.js";

// --- Types BDD ---

interface DbTicketUtilisateurRow {
    id_ticket: number;
    sujet: string;
    contenu: string;
    statut: StatutTicket;
    date_creation: string;
    date_dernier_action: string;
    ferme: boolean;
}

interface DbCommentaireRow {
    id_commentaire: number;
    contenu: string;
    date_envoi: string;
    username_auteur: string;
    role_auteur: string;
}

// --- Liste tickets d'un utilisateur ---

export async function listerTicketsUtilisateur(
    idUtilisateur: number
): Promise<ticketResumeUtilisateur[]> {
    const result = await query<DbTicketUtilisateurRow>(`
        SELECT id_ticket, sujet, contenu, statut, date_creation, date_dernier_action, ferme AS ferme
        FROM ticket
        WHERE id_utilisateur = $1
        ORDER BY date_creation DESC
    `, [idUtilisateur]);

    return result.rows.map(row => ({
        id: row.id_ticket,
        sujet: row.sujet,
        statut: row.statut,
        date_creation: row.date_creation,
        date_dernier_action: row.date_dernier_action,
        ferme: row.ferme
    }));
}

// --- Détail d'un ticket (uniquement si appartient à l'utilisateur) ---

export async function getDetailTicketUtilisateur(
    idTicket: number,
    idUtilisateur: number
): Promise<ticketDetailUtilisateur | null | "acces_refuse"> {
    const ticketResult = await query<DbTicketUtilisateurRow>(`
        SELECT id_ticket, sujet, contenu, statut, date_creation, date_dernier_action, ferme AS ferme
        FROM ticket
        WHERE id_ticket = $1
        LIMIT 1
    `, [idTicket]);

    if (ticketResult.rows.length === 0) return null;

    const ticket = ticketResult.rows[0];

    // Vérifier que ce ticket appartient bien à cet utilisateur
    const appartient = await query<{ id_utilisateur: number }>(
        "SELECT id_utilisateur FROM ticket WHERE id_ticket = $1 LIMIT 1",
        [idTicket]
    );

    if (appartient.rows[0]?.id_utilisateur !== idUtilisateur) {
        return "acces_refuse";
    }

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

    const commentaires: commentaireItem[] = commentairesResult.rows.map(c => ({
        id: c.id_commentaire,
        contenu: c.contenu,
        date_envoi: c.date_envoi,
        username_auteur: c.username_auteur,
        role_auteur: c.role_auteur
    }));

    return {
        id: ticket.id_ticket,
        sujet: ticket.sujet,
        contenu: ticket.contenu,
        statut: ticket.statut,
        date_creation: ticket.date_creation,
        date_dernier_action: ticket.date_dernier_action,
        ferme: ticket.ferme,
        commentaires
    };
}

// --- Créer un ticket ---

export async function creerTicket(
    idUtilisateur: number,
    sujet: string,
    contenu: string
): Promise<{ id: number }> {
    const result = await query<{ id_ticket: number }>(
        "INSERT INTO ticket (sujet, contenu, id_utilisateur) VALUES ($1, $2, $3) RETURNING id_ticket",
        [sujet.trim(), contenu.trim(), idUtilisateur]
    );
    return { id: result.rows[0].id_ticket };
}

// --- Commenter un ticket (par l'utilisateur propriétaire) ---

export async function commenterTicketUtilisateur(
    idTicket: number,
    idUtilisateur: number,
    contenu: string
): Promise<"success" | "ticket_introuvable" | "acces_refuse" | "ticket_ferme"> {
    // Vérifier appartenance
    const appartient = await query<{ id_utilisateur: number }>(
        "SELECT id_utilisateur FROM ticket WHERE id_ticket = $1 LIMIT 1",
        [idTicket]
    );

    if (appartient.rows.length === 0) return "ticket_introuvable";
    if (appartient.rows[0].id_utilisateur !== idUtilisateur) return "acces_refuse";

    return ajouterCommentaire(idTicket, idUtilisateur, contenu);
}

export async function fermerTicketUtilisateur(
    idTicket: number,
    idUtilisateur: number
): Promise<"success" | "ticket_introuvable" | "acces_refuse" | "deja_ferme"> {
    const appartient = await query<{ id_utilisateur: number }>(
        "SELECT id_utilisateur FROM ticket WHERE id_ticket = $1 LIMIT 1",
        [idTicket]
    );

    if (appartient.rows.length === 0) return "ticket_introuvable";
    if (appartient.rows[0].id_utilisateur !== idUtilisateur) return "acces_refuse";

    return fermerTicket(idTicket, idUtilisateur);
}
