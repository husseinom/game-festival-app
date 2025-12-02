# SecureApp - Environnement de Développement

Ce projet utilise Docker pour garantir que tout le monde travaille sur le même environnement (Node, Postgres, Angular).

## ⚠️ RÈGLES D'OR (À LIRE AVANT DE COMMENCER)

- **NE JAMAIS LANCER** `ng serve`, `npm start` ou `npm run dev` sur votre machine locale.
    - **Pourquoi ?** Le serveur et le front tournent **DANS Docker**. Si vous lancez en local, vous aurez des conflits de ports et des erreurs de base de données.
- L'installation locale (`npm install`) sert uniquement à **VS Code**.
    - Cela permet d'avoir l'autocomplétion et d'éviter les lignes rouges dans l'éditeur. L'exécution réelle se fait dans le conteneur.

---

## 🛠️ 1. Première Installation (À faire une seule fois)

1. **Cloner le projet :**
     ```bash
     git clone <url-du-repo>
     cd secureapp
     ```

2. **Installer les dépendances locales** (Pour l'autocomplétion VS Code uniquement) :
     ```bash
     # Dans le dossier backend
     cd backend && npm install
     cd ..

     # Dans le dossier frontend
     cd frontend && npm install
     cd ..
     ```
     > **Note :** Ne pas se soucier des vulnérabilités affichées ici, ce n'est que pour l'éditeur.

3. **Lancer le projet avec Docker :**
     ```bash
     docker-compose up --build
     ```
     > Cette étape peut prendre quelques minutes la première fois (téléchargement des images).

---

## 🚦 2. Utilisation Quotidienne

### Démarrer le projet :
```bash
docker-compose up
```
> Le backend et le frontend se rechargent automatiquement (Hot Reload) quand vous sauvegardez un fichier.

### Arrêter le projet :
- Faire `CTRL + C` dans le terminal ou :
    ```bash
    docker-compose down
    ```

### Accès Rapides :
- **Frontend (Angular)** : [http://localhost:4200](http://localhost:4200)
- **Backend (API)** : [http://localhost:4000](http://localhost:4000)
- **Gestion BDD (Adminer)** : [http://localhost:8081](http://localhost:8081)
    - **Système** : PostgreSQL
    - **Serveur** : db
    - **Utilisateur** : secureapp
    - **Mot de passe** : secureapp
    - **Base de données** : secureapp

---

## 📦 3. Gestion des Packages & BDD

### Ajouter une nouvelle librairie (npm) :
1. Installe en local :
     ```bash
     npm install nom-du-paquet
     ```
     (dans `backend/` ou `frontend/`)

2. Relance Docker pour qu'il l'installe :
     ```bash
     docker-compose up --build
     ```

### Migrations Prisma (Base de données) :
Pour modifier la structure de la BDD, exécute les commandes dans le conteneur backend :
1. Ouvrir un nouveau terminal pendant que Docker tourne.
2. Lancer la migration :
     ```bash
     docker-compose exec backend npx prisma migrate dev --name nom_de_la_modif
     ```

### Réinitialiser la Base de données (En cas de gros problème) :
```bash
docker-compose down -v
docker-compose up
```
