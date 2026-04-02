# support-technicien-ticket

Application fullstack de support technicien ticket (authentification, gestion des tickets, commentaires, suivi de statut, fermeture).

## URL GitHub

- https://github.com/AhmetcanBarkay/support-technicien-ticket

## Stack technique

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Base de données: PostgreSQL

## Liste des fonctionnalités (Diagramme des Use Case)

Le diagramme de cas d'utilisation est disponible ci-dessous:

![Diagramme use case](illustrations/use_cases.png)

Fonctionnalités principales:

- Utilisateur: créer un compte, se connecter, créer un ticket, consulter ses tickets, commenter, fermer un ticket, changer son mot de passe.
- Technicien: consulter tous les tickets, changer le statut, commenter, fermer un ticket, changer son mot de passe.
- Administrateur: gérer les comptes techniciens.

## Données manipulées (Modèle Entité-Association)

Le MCD actuel est le suivant:

![MCD de l'application](illustrations/mcd.png)

Entités manipulées:

- personne: identifiant, mot de passe hashé, token, rôle, date de création.
- ticket: sujet, contenu, statut, date de création, date dernier action, état de fermeture.
- commentaire: contenu, date envoi, auteur, ticket associé.

Relations importantes:

- Une personne utilisateur peut créer plusieurs tickets.
- Un ticket appartient à un seul utilisateur créateur.
- Un ticket peut contenir plusieurs commentaires.
- Un commentaire est lié à un ticket et à une personne auteur.

## Contraintes métier ticket

- Un utilisateur ne peut voir et commenter que ses propres tickets.
- Un technicien peut consulter tous les tickets.
- Un ticket fermé ne peut plus être commenté ni changer de statut.
- Un ticket peut être fermé par son utilisateur propriétaire ou par un technicien.
- Les tickets fermés sont supprimés automatiquement après 7 jours.

Déroulement général d'un traitement de ticket:

1. L'utilisateur crée un ticket.
2. Le technicien consulte la liste et ouvre le détail.
3. Le technicien change le statut et commente selon le besoin.
4. Le ticket est fermé par utilisateur ou technicien quand le traitement est terminé.
5. Le backend bloque ensuite les nouvelles actions sur ce ticket fermé.

## Installation et lancement

Prérequis:

- Node.js 20+
- npm 10+
- PostgreSQL

1. Installer les dépendances depuis la racine:

```bash
npm install
```

2. Créer le fichier .env à la racine (à partir de .env.example):

```env
PORT=3000
DATABASE_URL=postgres://votre_user:votre_mot_de_passe@127.0.0.1:5432/nom_bdd
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ChangeMe123!
BCRYPT_SALT_ROUNDS=10
```

Notes:

- BCRYPT_SALT_ROUNDS est optionnel (entier 4..31). Valeur par défaut: 10.
- Au démarrage backend, le schéma est initialisé et le compte admin est garanti.

3. Démarrer l'application en développement (2 terminaux recommandés):

Terminal 1 (backend API):

```bash
npm run dev:backend
```

Terminal 2 (frontend Vite):

```bash
npm run dev:frontend
```

Les deux processus doivent tourner en même temps en mode dev:

- le backend expose l'API (port 3000 par défaut)
- le frontend sert l'interface web (port 5173 par défaut)

Si un seul des deux est lancé, l'application sera partiellement utilisable.

URLs locales:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

Limites de sécurité (mode test actuel):

- POST /auth/connexion: 10 tentatives maximum par 15 minutes
- POST /auth/inscription: 20 créations de comptes maximum par 15 minutes
- Toutes les routes /utilisateur: 300 requêtes maximum par IP sur 15 minutes

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
Il exécute automatiquement tous les fichiers *.test.ts dans backend/src/tests.
Il couvre les fonctionnalités de l'authentification, des permissions rôles et des triggers avec des fichiers séparés:

- auth
- admin
- technicien
- utilisateur
- trigger

Initialisation rapide des données de test:

```bash
npm run seed-test-data
```

Ce script ajoute des données de base via les services backend:

- 1 compte technicien de test
- 2 comptes utilisateurs de test
- 4 tickets de test
- commentaires de test sur plusieurs tickets
- 1 ticket fermé de test

Identifiants du compte technicien de test (affichés aussi en sortie de script):

- Username: technicien_test
- Mot de passe: Testtech123!

Identifiants des comptes utilisateurs de test (affichés aussi en sortie de script):

- Username: utilisateur_test_1
- Username: utilisateur_test_2
- Mot de passe (les 2 comptes): Testclient123!

Tests fonctionnels manuels recommandés:

1. Se connecter avec le compte admin (défini par ADMIN_USERNAME / ADMIN_PASSWORD dans .env).
2. Créer un compte technicien depuis l'espace admin.
3. Créer un compte utilisateur puis se connecter.
4. Créer un ticket depuis l'espace utilisateur.
5. Se connecter en technicien et changer le statut du ticket.
6. Échanger des commentaires entre utilisateur et technicien.
7. Fermer un ticket puis vérifier le blocage des nouvelles actions.
8. Vérifier le changement de mot de passe (utilisateur et technicien).

## Scripts utiles

- npm run dev:backend: démarre le backend en watch.
- npm run dev:frontend: démarre le frontend Vite.
- npm run build:backend: compile le backend.
- npm run build:frontend: compile le frontend.
- npm run build: build complet backend + frontend.
- npm run test: lance tous les tests du dossier backend/src/tests.
- npm run seed-test-data: ajoute des données de base de test (comptes, tickets, commentaires).
- npm run start: lance le backend compilé.
