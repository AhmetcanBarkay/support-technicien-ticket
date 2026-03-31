import assert from "node:assert/strict";
import { test } from "node:test";
import {
    capturerMessageErreur,
    configurerTestsAvecServices,
    genererNomUnique,
    nettoyerPersonneParNom
} from "./helpers/testHelpers.js";

const getServices = configurerTestsAvecServices(async () => ({
    personneService: await import("../services/personneService.js"),
    postgres: await import("../db/postgres.js")
}));

test("Trigger : bloque la modification du role", async () => {
    const { personneService, postgres } = getServices();
    const identifiant = genererNomUnique("trigger_role_block");

    try {
        const creation = await personneService.creerUtilisateur(identifiant, "Testclient123!");
        assert.equal(creation.status, "success");
        assert.ok(creation.personne);

        const messageErreur = await capturerMessageErreur(() => postgres.query(
            "UPDATE personne SET role = 'technicien' WHERE id_personne = $1",
            [creation.personne!.id]
        ));

        assert.equal(messageErreur.includes("Modification du role interdite"), true);

        const apres = await personneService.getPersonneParIdentifiant(identifiant);
        assert.ok(apres);
        assert.equal(apres?.role, "utilisateur");
    } finally {
        await nettoyerPersonneParNom(personneService, identifiant);
    }
});
