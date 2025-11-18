import { Pool } from 'pg'
// Récupération de la variable d'environnement Docker
const pool = new Pool({
    connectionString:
        process.env.DATABASE_URL ||
        'postgres://secureapp:secureapp@localhost:5432/secureapp',
});
export {pool}