import type { StatutTicket } from "@shared/types/statutsTicket.js";

// Représente un ticket de support
interface Ticket {
    id: number;
    sujet: string;
    contenu: string;
    statut: StatutTicket;
    date_creation: Date;
    date_dernier_action: Date;
    ferme: boolean;
    id_utilisateur: number;
}

export default Ticket;
