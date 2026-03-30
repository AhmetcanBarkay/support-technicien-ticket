import type { Role } from "@shared/types/roles.js";

// Représente une personne authentifiée en mémoire (après récupération depuis la BDD)
interface Personne {
    id: number;
    username: string;
    hashedPassword: string;
    token: string;
    role: Role;
    date_creation: Date;
}

export default Personne;
