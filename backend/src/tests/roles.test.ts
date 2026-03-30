import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import { API_MESSAGES } from "@shared/constants/messages.js";
import {
    requireAdmin,
    requireTechnicien,
    requireUtilisateur
} from "../middlewares/authMiddleware.js";
import { genererNomUnique, nettoyerPersonneParNom } from "./helpers/testHelpers.js";

dotenv.config({ path: "../.env" });
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123!";

let db: typeof import("../db/initDatabase.js");
let adminService: typeof import("../services/adminService.js");
let personneService: typeof import("../services/personneService.js");

before(async () => {
    db = await import("../db/initDatabase.js");
    adminService = await import("../services/adminService.js");
    personneService = await import("../services/personneService.js");
    await db.initDatabase();
});

after(async () => {
    await db.closeDatabase();
});

test("Roles : cree et liste un compte technicien", async () => {
    const identifiantTechnicien = genererNomUnique("roles_test_technicien");

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

test("Roles : refuse la creation d'un doublon technicien", async () => {
    const identifiantTechnicien = genererNomUnique("roles_test_duplicate_tech");

    try {
        const premiereCreation = await adminService.creerCompteTechnicien(identifiantTechnicien);
        assert.equal(premiereCreation.status, "success");

        const secondeCreation = await adminService.creerCompteTechnicien(identifiantTechnicien);
        assert.equal(secondeCreation.status, "user_exists");
    } finally {
        await nettoyerPersonneParNom(personneService, identifiantTechnicien);
    }
});

test("Roles : supprime un technicien existant", async () => {
    const identifiantTechnicien = genererNomUnique("roles_test_delete_tech");

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

test("Roles : refuse la suppression d'un compte non technicien", async () => {
    const identifiantUtilisateur = genererNomUnique("roles_test_user");

    try {
        const creationUtilisateur = await personneService.creerUtilisateur(identifiantUtilisateur, "Testclient123!");
        assert.equal(creationUtilisateur.status, "success");

        const suppression = await adminService.supprimerCompteTechnicien(identifiantUtilisateur);
        assert.equal(suppression, "mauvais_role");
    } finally {
        await nettoyerPersonneParNom(personneService, identifiantUtilisateur);
    }
});

test("Roles : retourne not_found si le compte est introuvable", async () => {
    const identifiantInexistant = genererNomUnique("roles_test_missing_tech");
    const suppression = await adminService.supprimerCompteTechnicien(identifiantInexistant);
    assert.equal(suppression, "not_found");
});

function execMiddleware(
    middleware: (req: Request, res: Response, next: NextFunction) => unknown,
    user: Request["user"]
) {
    let statusCode = 0;
    let payload: unknown;
    let nextCalled = false;

    const req = { user } as Request;
    const res = {
        status(code: number) {
            statusCode = code;
            return this;
        },
        json(body: unknown) {
            payload = body;
            return this;
        }
    } as unknown as Response;

    const next: NextFunction = () => {
        nextCalled = true;
    };

    middleware(req, res, next);

    return { statusCode, payload, nextCalled };
}

test("Roles middleware : requireAdmin refuse un technicien", () => {
    const result = execMiddleware(requireAdmin, {
        id: 1,
        username: "tech1",
        hashedPassword: "hash",
        token: "t",
        role: "technicien",
        date_creation: new Date()
    });

    assert.equal(result.nextCalled, false);
    assert.equal(result.statusCode, 403);
    assert.deepEqual(result.payload, { success: false, reason: API_MESSAGES.ACCESS_DENIED });
});

test("Roles middleware : requireTechnicien refuse un admin", () => {
    const result = execMiddleware(requireTechnicien, {
        id: 1,
        username: "admin1",
        hashedPassword: "hash",
        token: "t",
        role: "admin",
        date_creation: new Date()
    });

    assert.equal(result.nextCalled, false);
    assert.equal(result.statusCode, 403);
    assert.deepEqual(result.payload, { success: false, reason: API_MESSAGES.ACCESS_DENIED });
});

test("Roles middleware : requireUtilisateur refuse un admin", () => {
    const result = execMiddleware(requireUtilisateur, {
        id: 1,
        username: "admin1",
        hashedPassword: "hash",
        token: "t",
        role: "admin",
        date_creation: new Date()
    });

    assert.equal(result.nextCalled, false);
    assert.equal(result.statusCode, 403);
    assert.deepEqual(result.payload, { success: false, reason: API_MESSAGES.ACCESS_DENIED });
});
