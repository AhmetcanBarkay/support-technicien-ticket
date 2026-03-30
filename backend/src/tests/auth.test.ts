import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import dotenv from "dotenv";
import { genererNomUnique, nettoyerPersonneParNom } from "./helpers/testHelpers.js";

dotenv.config({ path: "../.env" });
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123!";

let db: typeof import("../db/initDatabase.js");
let personneService: typeof import("../services/personneService.js");

before(async () => {
    db = await import("../db/initDatabase.js");
    personneService = await import("../services/personneService.js");
    await db.initDatabase();
});

after(async () => {
    await db.closeDatabase();
});

test("Auth : inscrit un utilisateur puis permet la connexion", async () => {
    const identifiant = genererNomUnique("auth_register_login");
    const motDePasse = "Testclient123!";

    try {
        const inscription = await personneService.creerUtilisateur(identifiant, motDePasse);
        assert.equal(inscription.status, "success");
        assert.ok(inscription.personne);

        const connexion = await personneService.getPersonneParLogin(identifiant, motDePasse);
        assert.ok(connexion);
        assert.equal(connexion?.username, identifiant);
        assert.equal(connexion?.role, "utilisateur");
    } finally {
        await nettoyerPersonneParNom(personneService, identifiant);
    }
});

test("Auth : refuse la connexion avec un mot de passe invalide", async () => {
    const identifiant = genererNomUnique("auth_bad_password");

    try {
        const inscription = await personneService.creerUtilisateur(identifiant, "Testclient123!");
        assert.equal(inscription.status, "success");

        const connexion = await personneService.getPersonneParLogin(identifiant, "WrongPassword123!");
        assert.equal(connexion, undefined);
    } finally {
        await nettoyerPersonneParNom(personneService, identifiant);
    }
});

test("Auth : refuse le changement si le mot de passe actuel est incorrect", async () => {
    const identifiant = genererNomUnique("auth_change_wrong_current");

    try {
        const inscription = await personneService.creerUtilisateur(identifiant, "Testclient123!");
        assert.equal(inscription.status, "success");
        assert.ok(inscription.personne);

        const changement = await personneService.changerMotDePasse(
            inscription.personne!.id,
            "MauvaisActuel123!",
            "NouveauPass123!"
        );

        assert.equal(changement.status, "mot_de_passe_actuel_invalide");
    } finally {
        await nettoyerPersonneParNom(personneService, identifiant);
    }
});

test("Auth : change le mot de passe et renouvelle le token", async () => {
    const identifiant = genererNomUnique("auth_change_success");
    const ancienMotDePasse = "Testclient123!";
    const nouveauMotDePasse = "NouveauPass123!";

    try {
        const inscription = await personneService.creerUtilisateur(identifiant, ancienMotDePasse);
        assert.equal(inscription.status, "success");
        assert.ok(inscription.personne);

        const ancienToken = inscription.personne!.token;

        const changement = await personneService.changerMotDePasse(
            inscription.personne!.id,
            ancienMotDePasse,
            nouveauMotDePasse
        );

        assert.equal(changement.status, "success");
        assert.ok(changement.token);
        assert.notEqual(changement.token, ancienToken);

        const connexionAncien = await personneService.getPersonneParLogin(identifiant, ancienMotDePasse);
        assert.equal(connexionAncien, undefined);

        const connexionNouveau = await personneService.getPersonneParLogin(identifiant, nouveauMotDePasse);
        assert.ok(connexionNouveau);
    } finally {
        await nettoyerPersonneParNom(personneService, identifiant);
    }
});

test("Auth : refuse de reutiliser le meme mot de passe", async () => {
    const identifiant = genererNomUnique("auth_change_same_password");
    const motDePasse = "Testclient123!";

    try {
        const inscription = await personneService.creerUtilisateur(identifiant, motDePasse);
        assert.equal(inscription.status, "success");
        assert.ok(inscription.personne);

        const changement = await personneService.changerMotDePasse(
            inscription.personne!.id,
            motDePasse,
            motDePasse
        );

        assert.equal(changement.status, "meme_mot_de_passe");
    } finally {
        await nettoyerPersonneParNom(personneService, identifiant);
    }
});
