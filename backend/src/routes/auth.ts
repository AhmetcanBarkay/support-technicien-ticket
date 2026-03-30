import express from "express";
import {
    connexion,
    inscription,
    verifierToken,
    changerMotDePasseController
} from "../controllers/authController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/connexion", connexion);
router.post("/inscription", inscription);
router.post("/verifierToken", requireAuth, verifierToken);
router.post("/changerMotDePasse", requireAuth, changerMotDePasseController);

export default router;
