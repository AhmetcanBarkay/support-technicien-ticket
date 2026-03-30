import type { Request, Response } from "express";
import type {
    createTechnicienBody,
    createTechnicienResponse,
    deleteTechnicienBody,
    technicienListResponse
} from "@shared/types/api/adminApi.js";
import type { baseResponse } from "@shared/types/api/baseApi.js";
import { getUsernameRulesErrors } from "@shared/utils/usernameRules.js";
import {
    creerCompteTechnicien,
    listerTechniciens,
    supprimerCompteTechnicien
} from "../services/adminService.js";

export async function creerTechnicienController(
    req: Request<{}, createTechnicienResponse, createTechnicienBody>,
    res: Response<createTechnicienResponse>
) {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                success: false,
                reason: "Champs invalides : identifiant requis"
            });
        }

        const erreurs = getUsernameRulesErrors(username);
        if (erreurs.length > 0) {
            return res.status(400).json({
                success: false,
                reason: `Identifiant invalide :\n- ${erreurs.join("\n- ")}`
            });
        }

        const resultat = await creerCompteTechnicien(username);

        if (resultat.status === "user_exists") {
            return res.status(409).json({ success: false, reason: "Identifiant déjà utilisé" });
        }
        if (resultat.status !== "success") {
            return res.status(500).json({ success: false, reason: "Erreur interne" });
        }

        return res.status(201).json({
            success: true,
            id: resultat.id,
            generatedPassword: resultat.generatedPassword
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: "Erreur interne" });
    }
}

export async function supprimerTechnicienController(
    req: Request<{}, baseResponse, deleteTechnicienBody>,
    res: Response<baseResponse>
) {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ success: false, reason: "Identifiant requis" });
        }

        const resultat = await supprimerCompteTechnicien(username);

        if (resultat === "not_found") {
            return res.status(404).json({ success: false, reason: "Compte introuvable" });
        }
        if (resultat === "mauvais_role") {
            return res.status(400).json({
                success: false,
                reason: "Ce compte n'est pas un technicien"
            });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: "Erreur interne" });
    }
}

export async function listerTechniciensController(
    req: Request<{}, technicienListResponse>,
    res: Response<technicienListResponse>
) {
    try {
        const techniciens = await listerTechniciens();
        return res.status(200).json({ success: true, techniciens });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: "Erreur interne" });
    }
}
