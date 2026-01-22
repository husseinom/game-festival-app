# Game Festival App

Application web de gestion de festival de jeux de société.

## Stack technique

- **Frontend** : Angular
- **Backend** : Node.js / Express / Prisma
- **Base de données** : PostgreSQL

## Lancer le projet

### Prérequis

- Docker & Docker Compose

### Démarrer l'application

```bash
docker compose up --build
```

### Accès

| Service   | URL                         |
| --------- | --------------------------- |
| Frontend  | http://localhost:4200       |
| Backend   | http://localhost:4000       |
| Adminer   | http://localhost:8081       |

> **Adminer** : Serveur = `db`, User = `gamefest`, Password = `gamefest`, Database = `gamefest`

### Comptes utilisateurs de test

| Rôle               | Email               | Mot de passe |
| ------------------ | ------------------- | ------------ |
| Admin              | admin@fest.com      | 123456       |
| Organisateur       | justin@fest.com     | 123456       |
| Super Organisateur | super@fest.com      | 123456       |
| Bénévole           | benevole@fest.com   | 123456       |

### Importer les données CSV

L'import se fait automatiquement au premier lancement via le service `importer`.