import type { baseResponse } from "./baseApi.js";
import type { StatutTicket } from "../statutsTicket.js";

// --- Types des items ---

export interface ticketResumeTechnicien {
    id: number;
    sujet: string;
    statut: StatutTicket;
    date_creation: string;
    date_dernier_action: string;
    ferme: boolean;
    username_auteur: string;
}

export interface commentaireItem {
    id: number;
    contenu: string;
    date_envoi: string;
    username_auteur: string;
    role_auteur: string;
}

export interface ticketDetailTechnicien extends ticketResumeTechnicien {
    contenu: string;
    commentaires: commentaireItem[];
}

// --- Corps des requêtes ---

export interface changerStatutBody {
    ticketId: number;
    statut: StatutTicket;
}

export interface ajouterCommentaireTechnicienBody {
    ticketId: number;
    contenu: string;
}

export interface fermerTicketTechnicienBody {
    ticketId: number;
}

// --- Réponses ---

export interface ticketsListeTechnicienResponse extends baseResponse {
    tickets?: ticketResumeTechnicien[];
}

export interface ticketDetailTechnicienResponse extends baseResponse {
    ticket?: ticketDetailTechnicien;
}
