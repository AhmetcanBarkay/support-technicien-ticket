import express from "express";
import {
    connexion,
    inscription,
    verifierToken,
    changerMotDePasseController
} from "../controllers/authController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { loginRateLimiter, registerRateLimiter } from "../middlewares/rateLimitMiddleware.js";

const router = express.Router();

router.post("/connexion", loginRateLimiter, connexion);
router.post("/inscription", registerRateLimiter, inscription);
router.post("/verifierToken", requireAuth, verifierToken);
router.post("/changerMotDePasse", requireAuth, changerMotDePasseController);

export default router;
