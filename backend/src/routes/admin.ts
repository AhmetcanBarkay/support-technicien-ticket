import express from "express";
import {
    creerTechnicienController,
    supprimerTechnicienController,
    listerTechniciensController
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/techniciens", listerTechniciensController);
router.post("/technicien/creer", creerTechnicienController);
router.post("/technicien/supprimer", supprimerTechnicienController);

export default router;
