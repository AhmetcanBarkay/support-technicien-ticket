import type { Request, Response } from "express";
import type {
    changerStatutBody,
    ajouterCommentaireTechnicienBody,
    ticketsListeTechnicienResponse,
    ticketDetailTechnicienResponse
} from "@shared/types/api/technicienApi.js";
import type { baseResponse } from "@shared/types/api/baseApi.js";
import { STATUTS_TICKET } from "@shared/types/statutsTicket.js";
import { API_MESSAGES } from "@shared/constants/messages.js";
import {
    listerTousLesTickets,
    getDetailTicketTechnicien,
    changerStatutTicket,
    ajouterCommentaire
} from "../services/technicienService.js";

export async function listerTicketsController(
    req: Request<{}, ticketsListeTechnicienResponse>,
    res: Response<ticketsListeTechnicienResponse>
) {
    try {
        const tickets = await listerTousLesTickets();
        return res.status(200).json({ success: true, tickets });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: API_MESSAGES.INTERNAL_ERROR });
    }
}

export async function detailTicketController(
    req: Request<{ id: string }, ticketDetailTechnicienResponse>,
    res: Response<ticketDetailTechnicienResponse>
) {
    try {
        const idTicket = parseInt(req.params.id, 10);
        if (isNaN(idTicket)) {
            return res.status(400).json({ success: false, reason: "Identifiant ticket invalide" });
        }

        const ticket = await getDetailTicketTechnicien(idTicket);
        if (!ticket) {
            return res.status(404).json({ success: false, reason: "Ticket introuvable" });
        }

        return res.status(200).json({ success: true, ticket });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: API_MESSAGES.INTERNAL_ERROR });
    }
}

export async function changerStatutController(
    req: Request<{}, baseResponse, changerStatutBody>,
    res: Response<baseResponse>
) {
    try {
        const { ticketId, statut } = req.body;

        if (typeof ticketId !== "number") {
            return res.status(400).json({ success: false, reason: "Identifiant ticket invalide" });
        }

        if (!STATUTS_TICKET.includes(statut)) {
            return res.status(400).json({
                success: false,
                reason: `Statut invalide. Valeurs possibles : ${STATUTS_TICKET.join(", ")}`
            });
        }

        const resultat = await changerStatutTicket(ticketId, statut);
        if (resultat === "introuvable") {
            return res.status(404).json({ success: false, reason: "Ticket introuvable" });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: API_MESSAGES.INTERNAL_ERROR });
    }
}

export async function commenterTicketTechnicienController(
    req: Request<{}, baseResponse, ajouterCommentaireTechnicienBody>,
    res: Response<baseResponse>
) {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, reason: API_MESSAGES.UNAUTHENTICATED });
        }

        const { ticketId, contenu } = req.body;

        if (typeof ticketId !== "number") {
            return res.status(400).json({ success: false, reason: "Identifiant ticket invalide" });
        }

        if (!contenu || contenu.trim().length === 0) {
            return res.status(400).json({ success: false, reason: "Contenu du commentaire requis" });
        }

        const resultat = await ajouterCommentaire(ticketId, req.user.id, contenu);
        if (resultat === "ticket_introuvable") {
            return res.status(404).json({ success: false, reason: "Ticket introuvable" });
        }

        return res.status(201).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: API_MESSAGES.INTERNAL_ERROR });
    }
}
