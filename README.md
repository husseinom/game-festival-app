# 🎮 Game Festival App

Application web de gestion de festival de jeux de société.

## 🛠️ Stack technique

- **Frontend** : Angular
- **Backend** : Node.js / Express / Prisma
- **Base de données** : PostgreSQL

## 🚀 Lancer le projet

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

### Importer les données CSV

L'import se fait automatiquement au premier lancement via le service `importer`.

Pour relancer manuellement :

```bash
docker compose run --rm importer
```

### Arrêter le projet

```bash
docker compose down
```

### Réinitialiser la base de données

```bash
docker compose down -v
docker compose up --build
```
