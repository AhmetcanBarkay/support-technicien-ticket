import type { Request, Response } from "express";
import type {
    creerTicketBody,
    creerTicketResponse,
    ajouterCommentaireUtilisateurBody,
    ticketsListeUtilisateurResponse,
    ticketDetailUtilisateurResponse
} from "@shared/types/api/utilisateurApi.js";
import type { baseResponse } from "@shared/types/api/baseApi.js";
import { API_MESSAGES } from "@shared/constants/messages.js";
import {
    listerTicketsUtilisateur,
    getDetailTicketUtilisateur,
    creerTicket,
    commenterTicketUtilisateur
} from "../services/utilisateurService.js";

export async function listerMesTicketsController(
    req: Request<{}, ticketsListeUtilisateurResponse>,
    res: Response<ticketsListeUtilisateurResponse>
) {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, reason: API_MESSAGES.UNAUTHENTICATED });
        }

        const tickets = await listerTicketsUtilisateur(req.user.id);
        return res.status(200).json({ success: true, tickets });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: API_MESSAGES.INTERNAL_ERROR });
    }
}

export async function detailMonTicketController(
    req: Request<{ id: string }, ticketDetailUtilisateurResponse>,
    res: Response<ticketDetailUtilisateurResponse>
) {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, reason: API_MESSAGES.UNAUTHENTICATED });
        }

        const idTicket = parseInt(req.params.id, 10);
        if (isNaN(idTicket)) {
            return res.status(400).json({ success: false, reason: "Identifiant ticket invalide" });
        }

        const ticket = await getDetailTicketUtilisateur(idTicket, req.user.id);

        if (ticket === null) {
            return res.status(404).json({ success: false, reason: "Ticket introuvable" });
        }
        if (ticket === "acces_refuse") {
            return res.status(403).json({ success: false, reason: API_MESSAGES.ACCESS_DENIED });
        }

        return res.status(200).json({ success: true, ticket });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: API_MESSAGES.INTERNAL_ERROR });
    }
}

export async function creerTicketController(
    req: Request<{}, creerTicketResponse, creerTicketBody>,
    res: Response<creerTicketResponse>
) {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, reason: API_MESSAGES.UNAUTHENTICATED });
        }

        const { sujet, contenu } = req.body;

        if (!sujet || sujet.trim().length === 0) {
            return res.status(400).json({ success: false, reason: "Sujet requis" });
        }
        if (!contenu || contenu.trim().length === 0) {
            return res.status(400).json({ success: false, reason: "Contenu requis" });
        }
        if (sujet.length > 200) {
            return res.status(400).json({ success: false, reason: "Sujet : 200 caractères maximum" });
        }

        const { id } = await creerTicket(req.user.id, sujet, contenu);
        return res.status(201).json({ success: true, id });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: API_MESSAGES.INTERNAL_ERROR });
    }
}

export async function commenterMonTicketController(
    req: Request<{}, baseResponse, ajouterCommentaireUtilisateurBody>,
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

        const resultat = await commenterTicketUtilisateur(ticketId, req.user.id, contenu);

        if (resultat === "ticket_introuvable") {
            return res.status(404).json({ success: false, reason: "Ticket introuvable" });
        }
        if (resultat === "acces_refuse") {
            return res.status(403).json({ success: false, reason: API_MESSAGES.ACCESS_DENIED });
        }

        return res.status(201).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: API_MESSAGES.INTERNAL_ERROR });
    }
}
