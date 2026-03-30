import type { Request } from "express";
import type Personne from "../../models/personne.js";

// Extension du type Request Express pour y attacher la personne authentifiée
declare global {
    namespace Express {
        interface Request {
            user?: Personne;
        }
    }
}
