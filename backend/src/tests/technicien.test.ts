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

test("Technicien : peut changer le statut d'un ticket", async () => {
    const { personneService, utilisateurService, technicienService } = getServices();
    const identifiantUtilisateur = genererNomUnique("technicien_test_status_user");

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
    } finally {
        await nettoyerPersonneParNom(personneService, identifiantUtilisateur);
    }
});

test("Technicien : fermeture ajoute un commentaire et bloque les actions", async () => {
    const { personneService, utilisateurService, technicienService } = getServices();
    const identifiantUtilisateur = genererNomUnique("technicien_test_close_user");
    const identifiantTechnicien = genererNomUnique("technicien_test_close_tech");

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
        assert.equal(detail?.ferme, true);
        const dernierCommentaire = detail!.commentaires[detail!.commentaires.length - 1];
        assert.equal(dernierCommentaire?.contenu, "J'ai fermé ce ticket");

        const commentaireApresFermeture = await technicienService.ajouterCommentaire(
            creationTicket.id,
            creationTechnicien.personne!.id,
            "Message apres fermeture"
        );
        assert.equal(commentaireApresFermeture, "ticket_ferme");
    } finally {
        await nettoyerPersonneParNom(personneService, identifiantUtilisateur);
        await nettoyerPersonneParNom(personneService, identifiantTechnicien);
    }
});
