import type { baseResponse } from "./baseApi.js";
import type { StatutTicket } from "../statutsTicket.js";
import type { commentaireItem } from "./technicienApi.js";

// --- Types des items ---

export interface ticketResumeUtilisateur {
    id: number;
    sujet: string;
    statut: StatutTicket;
    date_creation: string;
    date_dernier_action: string;
    ferme: boolean;
}

export interface ticketDetailUtilisateur extends ticketResumeUtilisateur {
    contenu: string;
    commentaires: commentaireItem[];
}

// --- Corps des requêtes ---

export interface creerTicketBody {
    sujet: string;
    contenu: string;
}

export interface ajouterCommentaireUtilisateurBody {
    ticketId: number;
    contenu: string;
}

export interface fermerTicketUtilisateurBody {
    ticketId: number;
}

// --- Réponses ---

export interface ticketsListeUtilisateurResponse extends baseResponse {
    tickets?: ticketResumeUtilisateur[];
}

export interface ticketDetailUtilisateurResponse extends baseResponse {
    ticket?: ticketDetailUtilisateur;
}

export interface creerTicketResponse extends baseResponse {
    id?: number;
}
