import { Pool } from 'pg'

// Récupération de la variable d'environnement Docker
const pool = new Pool({
    connectionString:
        process.env.DATABASE_URL
});

export {pool}