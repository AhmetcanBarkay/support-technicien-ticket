import express from "express";
import {
    listerTicketsController,
    detailTicketController,
    changerStatutController,
    commenterTicketTechnicienController
} from "../controllers/technicienController.js";

const router = express.Router();

// Liste de tous les tickets
router.get("/tickets", listerTicketsController);

// Détail d'un ticket avec commentaires
router.get("/ticket/:id", detailTicketController);

// Changer le statut d'un ticket
router.post("/ticket/statut", changerStatutController);

// Ajouter un commentaire sur un ticket
router.post("/ticket/commenter", commenterTicketTechnicienController);

export default router;
