import dotenv from "dotenv";
import { closeDatabase, initDatabase } from "../db/initDatabase.js";
import {
    creerTechnicien,
    creerUtilisateur,
    getPersonneParIdentifiant,
    supprimerPersonneParId
} from "../services/personneService.js";
import { creerTicket } from "../services/utilisateurService.js";
import { ajouterCommentaire, changerStatutTicket, fermerTicket } from "../services/technicienService.js";
import type { StatutTicket } from "@shared/types/statutsTicket.js";

dotenv.config({ path: "../.env" });

type CompteUtilisateurSeed = {
    username: string;
    password: string;
};

type TicketCommentaireSeed = {
    auteur: "utilisateur" | "technicien";
    contenu: string;
};

type TicketSeed = {
    usernameAuteur: string;
    sujet: string;
    contenu: string;
    statut?: StatutTicket;
    commentaires?: TicketCommentaireSeed[];
    fermerPar?: "utilisateur" | "technicien";
};

const TECHNICIEN_TEST = {
    username: "technicien_test",
    password: "Testtech123!"
};

const UTILISATEURS_TEST = [
    { username: "utilisateur_test_1", password: "Testclient123!" },
    { username: "utilisateur_test_2", password: "Testclient123!" }
] satisfies CompteUtilisateurSeed[];

const TICKETS_AJOUT = [
    {
        usernameAuteur: "utilisateur_test_1",
        sujet: "Impossible de se connecter",
        contenu: "Je n'arrive plus a me connecter depuis ce matin.",
        statut: "en_attente"
    },
    {
        usernameAuteur: "utilisateur_test_1",
        sujet: "Erreur lors de l'envoi de message",
        contenu: "Le formulaire affiche une erreur 500.",
        statut: "en_cours",
        commentaires: [
            { auteur: "technicien", contenu: "Nous analysons le probleme." },
            { auteur: "utilisateur", contenu: "Merci, j'attends votre retour." }
        ]
    },
    {
        usernameAuteur: "utilisateur_test_2",
        sujet: "Page blanche apres connexion",
        contenu: "Apres authentification, je vois une page blanche.",
        statut: "non_resolu",
        commentaires: [
            { auteur: "technicien", contenu: "Le bug est reproduit, correction en cours." }
        ]
    },
    {
        usernameAuteur: "utilisateur_test_2",
        sujet: "Demande resolue",
        contenu: "Le probleme est corrige, merci.",
        statut: "resolu",
        commentaires: [
            { auteur: "technicien", contenu: "Le correctif a ete deploye." }
        ],
        fermerPar: "technicien"
    }
] satisfies TicketSeed[];

type CompteSeedResult = {
    id: number;
    username: string;
    password: string;
};

async function assurerCompteUtilisateur(seed: CompteUtilisateurSeed): Promise<CompteSeedResult> {
    const existing = await getPersonneParIdentifiant(seed.username);
    if (existing) {
        if (existing.role !== "utilisateur") {
            throw new Error(`Le compte ${seed.username} existe deja avec un autre role`);
        }
        await supprimerPersonneParId(existing.id);
    }

    const created = await creerUtilisateur(seed.username, seed.password);
    if (created.status !== "success" || !created.personne) {
        throw new Error(`Impossible de creer le compte utilisateur: ${seed.username}`);
    }

    return {
        id: created.personne.id,
        username: seed.username,
        password: seed.password
    };
}

async function assurerCompteTechnicien(seed: CompteUtilisateurSeed): Promise<CompteSeedResult> {
    const existing = await getPersonneParIdentifiant(seed.username);
    if (existing) {
        if (existing.role !== "technicien") {
            throw new Error(`Le compte ${seed.username} existe deja avec un autre role`);
        }
        await supprimerPersonneParId(existing.id);
    }

    const created = await creerTechnicien(seed.username, seed.password);
    if (created.status !== "success" || !created.personne) {
        throw new Error(`Impossible de creer le compte technicien: ${seed.username}`);
    }

    return {
        id: created.personne.id,
        username: seed.username,
        password: seed.password
    };
}

async function seedTicket(
    seed: TicketSeed,
    utilisateursByUsername: Map<string, CompteSeedResult>,
    technicienId: number
): Promise<number> {
    const auteur = utilisateursByUsername.get(seed.usernameAuteur);
    if (!auteur) {
        throw new Error(`Utilisateur introuvable pour le ticket: ${seed.usernameAuteur}`);
    }

    const creation = await creerTicket(auteur.id, seed.sujet, seed.contenu);
    const ticketId = creation.id;

    if (seed.statut && seed.statut !== "en_attente") {
        const majStatut = await changerStatutTicket(ticketId, seed.statut);
        if (majStatut !== "success") {
            throw new Error(`Impossible de changer le statut du ticket ${ticketId}`);
        }
    }

    for (const commentaire of seed.commentaires ?? []) {
        const idAuteur = commentaire.auteur === "technicien" ? technicienId : auteur.id;
        const ajout = await ajouterCommentaire(ticketId, idAuteur, commentaire.contenu);
        if (ajout !== "success") {
            throw new Error(`Impossible d'ajouter un commentaire sur le ticket ${ticketId}`);
        }
    }

    if (seed.fermerPar) {
        const idFermeture = seed.fermerPar === "technicien" ? technicienId : auteur.id;
        const fermeture = await fermerTicket(ticketId, idFermeture);
        if (fermeture !== "success") {
            throw new Error(`Impossible de fermer le ticket ${ticketId}`);
        }
    }

    return ticketId;
}

async function seed(): Promise<void> {
    await initDatabase();

    const technicien = await assurerCompteTechnicien(TECHNICIEN_TEST);

    const utilisateurs: CompteSeedResult[] = [];
    for (const userSeed of UTILISATEURS_TEST) {
        const user = await assurerCompteUtilisateur(userSeed);
        utilisateurs.push(user);
    }

    const utilisateursByUsername = new Map(utilisateurs.map(user => [user.username, user]));

    const ticketsIds: number[] = [];
    for (const ticketSeed of TICKETS_AJOUT) {
        const ticketId = await seedTicket(ticketSeed, utilisateursByUsername, technicien.id);
        ticketsIds.push(ticketId);
    }

    console.log("[seed:test-data] Donnees de base ajoutees.");
    console.log(`[seed:test-data] Tickets de test crees: ${ticketsIds.length}`);
    console.log(`[seed:test-data] Compte technicien: ${technicien.username}`);
    console.log(`[seed:test-data] Mot de passe technicien: ${technicien.password}`);
    console.log("[seed:test-data] Comptes utilisateurs:");
    for (const user of utilisateurs) {
        console.log(`[seed:test-data] - ${user.username} | mot de passe: ${user.password}`);
    }
}

seed()
    .catch((error) => {
        console.error("[seed:test-data] Echec:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await closeDatabase();
    });
