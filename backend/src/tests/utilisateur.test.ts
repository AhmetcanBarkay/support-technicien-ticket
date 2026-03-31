import assert from "node:assert/strict";
import { test } from "node:test";
import {
    configurerTestsAvecServices,
    genererNomUnique,
    nettoyerPersonneParNom
} from "./helpers/testHelpers.js";

const getServices = configurerTestsAvecServices(async () => ({
    personneService: await import("../services/personneService.js"),
    utilisateurService: await import("../services/utilisateurService.js"),
    technicienService: await import("../services/technicienService.js")
}));

test("Utilisateur : cree un ticket et le retrouve dans sa liste", async () => {
    const { personneService, utilisateurService } = getServices();
    const identifiantUtilisateur = genererNomUnique("utilisateur_test_create_ticket");

    try {
        const creationUtilisateur = await personneService.creerUtilisateur(identifiantUtilisateur, "Testclient123!");
        assert.equal(creationUtilisateur.status, "success");
        assert.ok(creationUtilisateur.personne);

        const creationTicket = await utilisateurService.creerTicket(
            creationUtilisateur.personne!.id,
            "Sujet test ticket",
            "Contenu test ticket"
        );

        const mesTickets = await utilisateurService.listerTicketsUtilisateur(creationUtilisateur.personne!.id);
        const ticket = mesTickets.find(t => t.id === creationTicket.id);

        assert.ok(ticket);
        assert.equal(ticket?.sujet, "Sujet test ticket");
        assert.equal(ticket?.statut, "en_attente");
    } finally {
        await nettoyerPersonneParNom(personneService, identifiantUtilisateur);
    }
});

test("Utilisateur : ne peut pas acceder au ticket d'un autre", async () => {
    const { personneService, utilisateurService } = getServices();
    const identifiantA = genererNomUnique("utilisateur_test_owner_a");
    const identifiantB = genererNomUnique("utilisateur_test_owner_b");

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
    } finally {
        await nettoyerPersonneParNom(personneService, identifiantA);
        await nettoyerPersonneParNom(personneService, identifiantB);
    }
});
