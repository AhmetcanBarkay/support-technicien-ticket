import express from "express";
import {
    listerMesTicketsController,
    detailMonTicketController,
    creerTicketController,
    commenterMonTicketController
} from "../controllers/utilisateurController.js";

const router = express.Router();

// Mes tickets
router.get("/tickets", listerMesTicketsController);

// Détail d'un de mes tickets avec commentaires
router.get("/ticket/:id", detailMonTicketController);

// Créer un ticket
router.post("/ticket/creer", creerTicketController);

// Commenter sur mon ticket
router.post("/ticket/commenter", commenterMonTicketController);

export default router;
