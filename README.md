# support-technicien-ticket

Application fullstack de support technicien ticket (authentification, gestion des tickets, commentaires, suivi de statut, fermeture).

## URL GitHub

- https://github.com/AhmetcanBarkay/support-technicien-ticket

## Stack technique

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Base de donnees: PostgreSQL

## Liste des fonctionnalites (Diagramme des Use Case)

Le diagramme de cas d'utilisation est disponible ci-dessous:

![Diagramme use case](illustrations/use_cases.png)

Fonctionnalites principales:

- Utilisateur: creer un compte, se connecter, creer un ticket, consulter ses tickets, commenter, fermer un ticket, changer son mot de passe.
- Technicien: consulter tous les tickets, changer le statut, commenter, fermer un ticket, changer son mot de passe.
- Administrateur: gerer les comptes techniciens.

## Donnees manipulees (Modele Entite-Association)

Le MCD actuel est le suivant:

![MCD de l'application](illustrations/mcd.png)

Entites manipulees:

- personne: identifiant, mot de passe hashe, token, role, date de creation.
- ticket: sujet, contenu, statut, date de creation, date dernier action, etat de fermeture.
- commentaire: contenu, date envoi, auteur, ticket associe.

Relations importantes:

- Une personne utilisateur peut creer plusieurs tickets.
- Un ticket appartient a un seul utilisateur createur.
- Un ticket peut contenir plusieurs commentaires.
- Un commentaire est lie a un ticket et a une personne auteur.

## Contraintes metier ticket

- Un utilisateur ne peut voir et commenter que ses propres tickets.
- Un technicien peut consulter tous les tickets.
- Un ticket ferme ne peut plus etre commente ni changer de statut.
- Un ticket peut etre ferme par son utilisateur proprietaire ou par un technicien.
- Les tickets fermes sont supprimes automatiquement apres 7 jours.

Deroulement general d'un traitement de ticket:

1. L'utilisateur cree un ticket.
2. Le technicien consulte la liste et ouvre le detail.
3. Le technicien change le statut et commente selon le besoin.
4. Le ticket est ferme par utilisateur ou technicien quand le traitement est termine.
5. Le backend bloque ensuite les nouvelles actions sur ce ticket ferme.

## Installation et lancement

Prerequis:

- Node.js 20+
- npm 10+
- PostgreSQL

1. Installer les dependances depuis la racine:

```bash
npm install
```

2. Creer le fichier .env a la racine (a partir de .env.example):

```env
PORT=3000
DATABASE_URL=postgres://votre_user:votre_mot_de_passe@127.0.0.1:5432/nom_bdd
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ChangeMe123!
BCRYPT_SALT_ROUNDS=10
```

Notes:

- BCRYPT_SALT_ROUNDS est optionnel (entier 4..31). Valeur par defaut: 10.
- Au demarrage backend, le schema est initialise et le compte admin est garanti.

3. Demarrer l'application en developpement (2 terminaux recommandes):

Terminal 1 (backend API):

```bash
npm run dev:backend
```

Terminal 2 (frontend Vite):

```bash
npm run dev:frontend
```

Les deux processus doivent tourner en meme temps en mode dev:

- le backend expose l'API (port 3000 par defaut)
- le frontend sert l'interface web (port 5173 par defaut)

Si un seul des deux est lance, l'application sera partiellement utilisable.

URLs locales:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

Limites de securite (mode test actuel):

- POST /auth/connexion: 10 tentatives maximum par 15 minutes
- POST /auth/inscription: 20 creations de comptes maximum par 15 minutes
- Toutes les routes /utilisateur: 300 requetes maximum par IP sur 15 minutes

## Comment tester l'application

Tests techniques rapides:

```bash
npm run build
```

Ce script compile backend + frontend et valide que l'application build correctement.

Tests unitaires:

```bash
npm run test
```

Ce script lance tous les tests du dossier backend/src/tests.
Il execute automatiquement tous les fichiers *.test.ts dans backend/src/tests.
Il couvre les fonctionnalites de l'authentification, des permission roles et des triggers avec des fichiers séparés:

- auth
- admin
- technicien
- utilisateur
- trigger

Initialisation rapide des donnees de test:

```bash
npm run seed-test-data
```

Ce script ajoute des donnees de base via les services backend:

- 1 compte technicien de test
- 2 comptes utilisateurs de test
- 4 tickets de test
- commentaires de test sur plusieurs tickets
- 1 ticket ferme de test

Identifiants du compte technicien de test (affiches aussi en sortie de script):

- Username: technicien_test
- Mot de passe: Testtech123!

Identifiants des comptes utilisateurs de test (affiches aussi en sortie de script):

- Username: utilisateur_test_1
- Username: utilisateur_test_2
- Mot de passe (les 2 comptes): Testclient123!

Tests fonctionnels manuels recommandes:

1. Se connecter avec le compte admin (defini par ADMIN_USERNAME / ADMIN_PASSWORD dans .env).
2. Creer un compte technicien depuis l'espace admin.
3. Creer un compte utilisateur puis se connecter.
4. Creer un ticket depuis l'espace utilisateur.
5. Se connecter en technicien et changer le statut du ticket.
6. Echanger des commentaires entre utilisateur et technicien.
7. Fermer un ticket puis verifier le blocage des nouvelles actions.
8. Verifier le changement de mot de passe (utilisateur et technicien).

## Scripts utiles

- npm run dev:backend: demarre le backend en watch.
- npm run dev:frontend: demarre le frontend Vite.
- npm run build:backend: compile le backend.
- npm run build:frontend: compile le frontend.
- npm run build: build complet backend + frontend.
- npm run test: lance tous les tests du dossier backend/src/tests.
- npm run seed-test-data: ajoute des donnees de base de test (comptes, tickets, commentaires).
- npm run start: lance le backend compile.
