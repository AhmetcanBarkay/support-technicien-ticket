import type { Request, Response } from "express";
import type {
    loginBody,
    loginResponse,
    registerBody,
    registerResponse,
    verifyTokenBody,
    verifyTokenResponse,
    changePasswordBody,
    changePasswordResponse
} from "@shared/types/api/authApi.js";
import { API_MESSAGES } from "@shared/constants/messages.js";
import { getPasswordRulesErrors, isPasswordValid } from "@shared/utils/passwordRules.js";
import { getUsernameRulesErrors } from "@shared/utils/usernameRules.js";
import {
    getPersonneParLogin,
    creerUtilisateur,
    changerMotDePasse
} from "../services/personneService.js";

export async function verifierToken(
    req: Request<{}, verifyTokenResponse, verifyTokenBody>,
    res: Response<verifyTokenResponse>
) {
    res.status(200).json({
        success: req.user ? true : false,
        role: req.user?.role,
        username: req.user?.username
    });
}

export async function connexion(
    req: Request<{}, loginResponse, loginBody>,
    res: Response<loginResponse>
) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, reason: "Champs invalides" });
        }

        const errorsIdentifiant = getUsernameRulesErrors(username);
        if (errorsIdentifiant.length > 0) {
            return res.status(400).json({
                success: false,
                reason: `Identifiant invalide :\n- ${errorsIdentifiant.join("\n- ")}`
            });
        }

        if (password.length > 100) {
            return res.status(400).json({
                success: false,
                reason: "Mot de passe invalide, 100 caractères maximum"
            });
        }

        const personne = await getPersonneParLogin(username, password);
        if (!personne) {
            return res.status(401).json({ success: false, reason: API_MESSAGES.INVALID_CREDENTIALS });
        }

        return res.status(200).json({
            success: true,
            token: personne.token,
            role: personne.role,
            username: personne.username
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: API_MESSAGES.INTERNAL_ERROR });
    }
}

export async function inscription(
    req: Request<{}, registerResponse, registerBody>,
    res: Response<registerResponse>
) {
    try {
        const { username, password, confirmPassword } = req.body;
        const erreurs: string[] = [];

        if (!username) erreurs.push("identifiant requis");
        if (!password) erreurs.push("mot de passe requis");
        if (!confirmPassword) erreurs.push("confirmation requise");

        if (erreurs.length > 0) {
            return res.status(400).json({
                success: false,
                reason: `Champs invalides :\n- ${erreurs.join("\n- ")}`
            });
        }

        const errorsIdentifiant = getUsernameRulesErrors(username);
        if (errorsIdentifiant.length > 0) {
            return res.status(400).json({
                success: false,
                reason: `Identifiant invalide :\n- ${errorsIdentifiant.join("\n- ")}`
            });
        }

        const errorsMotDePasse = getPasswordRulesErrors(password);
        if (!isPasswordValid(password) || errorsMotDePasse.length > 0) {
            return res.status(400).json({
                success: false,
                reason: `Mot de passe invalide, il vous faut :\n- ${errorsMotDePasse.join("\n- ")}`
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                reason: "La confirmation doit être identique au mot de passe"
            });
        }

        const resultat = await creerUtilisateur(username, password);

        if (resultat.status === "user_exists") {
            return res.status(409).json({ success: false, reason: "Identifiant déjà utilisé" });
        }

        if (resultat.status !== "success" || !resultat.personne) {
            return res.status(500).json({ success: false, reason: API_MESSAGES.INTERNAL_ERROR });
        }

        return res.status(201).json({
            success: true,
            token: resultat.personne.token,
            role: resultat.personne.role,
            username: resultat.personne.username
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: API_MESSAGES.INTERNAL_ERROR });
    }
}

export async function changerMotDePasseController(
    req: Request<{}, changePasswordResponse, changePasswordBody>,
    res: Response<changePasswordResponse>
) {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, reason: API_MESSAGES.UNAUTHENTICATED });
        }

        // L'admin ne peut pas changer son mot de passe via cette route
        if (req.user.role === "admin") {
            return res.status(403).json({ success: false, reason: API_MESSAGES.ACCESS_DENIED });
        }

        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, reason: "Champs invalides" });
        }

        const errorsMotDePasse = getPasswordRulesErrors(newPassword);
        if (!isPasswordValid(newPassword) || errorsMotDePasse.length > 0) {
            return res.status(400).json({
                success: false,
                reason: `Mot de passe invalide, il vous faut :\n- ${errorsMotDePasse.join("\n- ")}`
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                reason: "La confirmation doit être identique au nouveau mot de passe"
            });
        }

        const resultat = await changerMotDePasse(req.user.id, currentPassword, newPassword);

        if (resultat.status === "not_found") {
            return res.status(404).json({ success: false, reason: API_MESSAGES.UNAUTHENTICATED });
        }
        if (resultat.status === "mot_de_passe_actuel_invalide") {
            return res.status(400).json({ success: false, reason: "Mot de passe actuel incorrect" });
        }
        if (resultat.status === "meme_mot_de_passe") {
            return res.status(400).json({
                success: false,
                reason: "Le nouveau mot de passe doit être différent de l'actuel"
            });
        }
        if (resultat.status === "error") {
            return res.status(500).json({ success: false, reason: API_MESSAGES.INTERNAL_ERROR });
        }

        return res.status(200).json({ success: true, token: resultat.token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, reason: API_MESSAGES.INTERNAL_ERROR });
    }
}
