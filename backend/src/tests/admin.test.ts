import assert from "node:assert/strict";
import { test } from "node:test";
import {
    configurerTestsAvecServices,
    genererNomUnique,
    nettoyerPersonneParNom
} from "./helpers/testHelpers.js";

const getServices = configurerTestsAvecServices(async () => ({
    adminService: await import("../services/adminService.js"),
    personneService: await import("../services/personneService.js")
}));

test("Admin : cree et liste un compte technicien", async () => {
    const { adminService, personneService } = getServices();
    const identifiantTechnicien = genererNomUnique("admin_test_technicien");

    try {
        const creation = await adminService.creerCompteTechnicien(identifiantTechnicien);
        assert.equal(creation.status, "success");
        assert.ok(creation.id);
        assert.ok(creation.generatedPassword);
        assert.equal(creation.generatedPassword?.length, 12);

        const liste = await adminService.listerTechniciens();
        assert.equal(liste.some(item => item.username === identifiantTechnicien), true);
    } finally {
        await nettoyerPersonneParNom(personneService, identifiantTechnicien);
    }
});

test("Admin : refuse la creation d'un doublon technicien", async () => {
    const { adminService, personneService } = getServices();
    const identifiantTechnicien = genererNomUnique("admin_test_duplicate_tech");

    try {
        const premiereCreation = await adminService.creerCompteTechnicien(identifiantTechnicien);
        assert.equal(premiereCreation.status, "success");

        const secondeCreation = await adminService.creerCompteTechnicien(identifiantTechnicien);
        assert.equal(secondeCreation.status, "user_exists");
    } finally {
        await nettoyerPersonneParNom(personneService, identifiantTechnicien);
    }
});

test("Admin : supprime un technicien existant", async () => {
    const { adminService, personneService } = getServices();
    const identifiantTechnicien = genererNomUnique("admin_test_delete_tech");

    try {
        const creation = await adminService.creerCompteTechnicien(identifiantTechnicien);
        assert.equal(creation.status, "success");

        const suppression = await adminService.supprimerCompteTechnicien(identifiantTechnicien);
        assert.equal(suppression, "success");

        const userApresSuppression = await personneService.getPersonneParIdentifiant(identifiantTechnicien);
        assert.equal(userApresSuppression, undefined);
    } finally {
        await nettoyerPersonneParNom(personneService, identifiantTechnicien);
    }
});

test("Admin : refuse la suppression d'un compte non technicien", async () => {
    const { adminService, personneService } = getServices();
    const identifiantUtilisateur = genererNomUnique("admin_test_user");

    try {
        const creationUtilisateur = await personneService.creerUtilisateur(identifiantUtilisateur, "Testclient123!");
        assert.equal(creationUtilisateur.status, "success");

        const suppression = await adminService.supprimerCompteTechnicien(identifiantUtilisateur);
        assert.equal(suppression, "mauvais_role");
    } finally {
        await nettoyerPersonneParNom(personneService, identifiantUtilisateur);
    }
});

test("Admin : retourne not_found si le compte est introuvable", async () => {
    const { adminService } = getServices();
    const identifiantInexistant = genererNomUnique("admin_test_missing_tech");
    const suppression = await adminService.supprimerCompteTechnicien(identifiantInexistant);
    assert.equal(suppression, "not_found");
});
