import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import dotenv from "dotenv";
import { genererNomUnique, nettoyerPersonneParNom } from "./helpers/testHelpers.js";

dotenv.config({ path: "../.env" });
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123!";

let db: typeof import("../db/initDatabase.js");
let personneService: typeof import("../services/personneService.js");
let utilisateurService: typeof import("../services/utilisateurService.js");
let technicienService: typeof import("../services/technicienService.js");

before(async () => {
    db = await import("../db/initDatabase.js");
    personneService = await import("../services/personneService.js");
    utilisateurService = await import("../services/utilisateurService.js");
    technicienService = await import("../services/technicienService.js");
    await db.initDatabase();
});

after(async () => {
    await db.closeDatabase();
});

test("Ticket : un utilisateur cree un ticket et le retrouve dans sa liste", async () => {
    const identifiantUtilisateur = genererNomUnique("ticket_test_create_user");

    try {
        const creationUtilisateur = await personneService.creerUtilisateur(identifiantUtilisateur, "Testclient123!");
        assert.equal(creationUtilisateur.status, "success");
        assert.ok(creationUtilisateur.personne);

        const creationTicket = await utilisateurService.creerTicket(
            creationUtilisateur.personne!.id,
            "Sujet test ticket",
            "Contenu test ticket"
        );

        assert.ok(creationTicket.id);

        const mesTickets = await utilisateurService.listerTicketsUtilisateur(creationUtilisateur.personne!.id);
        const ticket = mesTickets.find(t => t.id === creationTicket.id);

        assert.ok(ticket);
        assert.equal(ticket?.sujet, "Sujet test ticket");
        assert.equal(ticket?.statut, "en_attente");
        assert.equal(ticket?.fermee, false);
    } finally {
        await nettoyerPersonneParNom(personneService, identifiantUtilisateur);
    }
});

test("Ticket : un utilisateur ne peut pas acceder au ticket d'un autre", async () => {
    const identifiantA = genererNomUnique("ticket_test_owner_a");
    const identifiantB = genererNomUnique("ticket_test_owner_b");

    try {
        const utilisateurA = await personneService.creerUtilisateur(identifiantA, "Testclient123!");
        const utilisateurB = await personneService.creerUtilisateur(identifiantB, "Testclient123!");

        assert.equal(utilisateurA.status, "success");
        assert.equal(utilisateurB.status, "success");
        assert.ok(utilisateurA.personne);
        assert.ok(utilisateurB.personne);

        const creationTicket = await utilisateurService.creerTicket(
            utilisateurA.personne!.id,
            "Ticket prive",
            "Doit rester prive"
        );

        const detailInterdit = await utilisateurService.getDetailTicketUtilisateur(
            creationTicket.id,
            utilisateurB.personne!.id
        );
        assert.equal(detailInterdit, "acces_refuse");

        const commentaireInterdit = await utilisateurService.commenterTicketUtilisateur(
            creationTicket.id,
            utilisateurB.personne!.id,
            "Je ne devrais pas commenter"
        );
        assert.equal(commentaireInterdit, "acces_refuse");
    } finally {
        await nettoyerPersonneParNom(personneService, identifiantA);
        await nettoyerPersonneParNom(personneService, identifiantB);
    }
});

test("Ticket : un technicien peut changer le statut d'un ticket", async () => {
    const identifiantUtilisateur = genererNomUnique("ticket_test_status_user");

    try {
        const creationUtilisateur = await personneService.creerUtilisateur(identifiantUtilisateur, "Testclient123!");
        assert.equal(creationUtilisateur.status, "success");
        assert.ok(creationUtilisateur.personne);

        const creationTicket = await utilisateurService.creerTicket(
            creationUtilisateur.personne!.id,
            "Incident statut",
            "A traiter"
        );

        const changement = await technicienService.changerStatutTicket(creationTicket.id, "en_cours");
        assert.equal(changement, "success");

        const detail = await technicienService.getDetailTicketTechnicien(creationTicket.id);
        assert.ok(detail);
        assert.equal(detail?.statut, "en_cours");
        assert.equal(detail?.fermee, false);
    } finally {
        await nettoyerPersonneParNom(personneService, identifiantUtilisateur);
    }
});

test("Ticket : fermeture par technicien ajoute un commentaire et bloque les actions", async () => {
    const identifiantUtilisateur = genererNomUnique("ticket_test_close_user");
    const identifiantTechnicien = genererNomUnique("ticket_test_close_tech");

    try {
        const creationUtilisateur = await personneService.creerUtilisateur(identifiantUtilisateur, "Testclient123!");
        const creationTechnicien = await personneService.creerTechnicien(identifiantTechnicien, "Techpass123!");

        assert.equal(creationUtilisateur.status, "success");
        assert.equal(creationTechnicien.status, "success");
        assert.ok(creationUtilisateur.personne);
        assert.ok(creationTechnicien.personne);

        const creationTicket = await utilisateurService.creerTicket(
            creationUtilisateur.personne!.id,
            "Incident fermeture",
            "Le ticket sera ferme"
        );

        const fermeture = await technicienService.fermerTicket(
            creationTicket.id,
            creationTechnicien.personne!.id
        );
        assert.equal(fermeture, "success");

        const detail = await technicienService.getDetailTicketTechnicien(creationTicket.id);
        assert.ok(detail);
        assert.equal(detail?.fermee, true);
        const dernierCommentaire = detail!.commentaires[detail!.commentaires.length - 1];
        assert.equal(dernierCommentaire?.contenu, "J'ai fermé ce ticket");
        assert.equal(dernierCommentaire?.role_auteur, "technicien");

        const commentaireApresFermeture = await technicienService.ajouterCommentaire(
            creationTicket.id,
            creationTechnicien.personne!.id,
            "Message apres fermeture"
        );
        assert.equal(commentaireApresFermeture, "ticket_ferme");

        const statutApresFermeture = await technicienService.changerStatutTicket(creationTicket.id, "resolu");
        assert.equal(statutApresFermeture, "ticket_ferme");
    } finally {
        await nettoyerPersonneParNom(personneService, identifiantUtilisateur);
        await nettoyerPersonneParNom(personneService, identifiantTechnicien);
    }
});

test("Ticket : fermeture par utilisateur bloque aussi la fermeture technicien", async () => {
    const identifiantUtilisateur = genererNomUnique("ticket_test_user_close");
    const identifiantTechnicien = genererNomUnique("ticket_test_user_close_tech");

    try {
        const creationUtilisateur = await personneService.creerUtilisateur(identifiantUtilisateur, "Testclient123!");
        const creationTechnicien = await personneService.creerTechnicien(identifiantTechnicien, "Techpass123!");

        assert.equal(creationUtilisateur.status, "success");
        assert.equal(creationTechnicien.status, "success");
        assert.ok(creationUtilisateur.personne);
        assert.ok(creationTechnicien.personne);

        const creationTicket = await utilisateurService.creerTicket(
            creationUtilisateur.personne!.id,
            "Fermeture utilisateur",
            "Ferme par utilisateur"
        );

        const fermetureUtilisateur = await utilisateurService.fermerTicketUtilisateur(
            creationTicket.id,
            creationUtilisateur.personne!.id
        );
        assert.equal(fermetureUtilisateur, "success");

        const fermetureTechnicien = await technicienService.fermerTicket(
            creationTicket.id,
            creationTechnicien.personne!.id
        );
        assert.equal(fermetureTechnicien, "deja_ferme");

        const commentaireUtilisateur = await utilisateurService.commenterTicketUtilisateur(
            creationTicket.id,
            creationUtilisateur.personne!.id,
            "Commentaire apres fermeture"
        );
        assert.equal(commentaireUtilisateur, "ticket_ferme");
    } finally {
        await nettoyerPersonneParNom(personneService, identifiantUtilisateur);
        await nettoyerPersonneParNom(personneService, identifiantTechnicien);
    }
});
