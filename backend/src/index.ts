import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import technicienRoutes from "./routes/technicien.js";
import utilisateurRoutes from "./routes/utilisateur.js";
import { initDatabase, nettoyerTicketsFermes } from "./db/initDatabase.js";
import { requireAuth, requireAdmin, requireTechnicien, requireUtilisateur } from "./middlewares/authMiddleware.js";
import { clientGlobalRateLimiter } from "./middlewares/rateLimitMiddleware.js";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT || 3000;
const INTERVALLE_NETTOYAGE_MS = 24 * 60 * 60 * 1000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/admin", requireAuth, requireAdmin, adminRoutes);
app.use("/technicien", requireAuth, requireTechnicien, technicienRoutes);
app.use("/utilisateur", requireAuth, requireUtilisateur, clientGlobalRateLimiter, utilisateurRoutes);

// Route non trouvée
app.use((req: Request, res: Response) => {
    res.status(404).json({ success: false, reason: "Route non trouvée" });
});

async function demarrerServeur() {
    await initDatabase();

    const lancerNettoyage = async () => {
        try {
            const nb = await nettoyerTicketsFermes();
            if (nb > 0) {
                console.log(`Nettoyage tickets fermés: ${nb} ticket(s) supprimé(s)`);
            }
        } catch (err) {
            console.error("Erreur nettoyage tickets fermés:", err);
        }
    };

    await lancerNettoyage();
    setInterval(lancerNettoyage, INTERVALLE_NETTOYAGE_MS);

    app.listen(PORT, () => {
        console.log(`Serveur démarré sur le port ${PORT}`);
    });
}

demarrerServeur().catch((err) => {
    console.error("Erreur de démarrage :", err);
    process.exit(1);
});
