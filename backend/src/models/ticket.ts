import type { StatutTicket } from "@shared/types/statutsTicket.js";

// Représente un ticket de support
interface Ticket {
    id: number;
    sujet: string;
    contenu: string;
    statut: StatutTicket;
    date_creation: Date;
    id_utilisateur: number;
}

export default Ticket;
