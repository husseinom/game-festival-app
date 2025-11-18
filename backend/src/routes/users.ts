import { Router } from 'express'
import {pool} from '../db/database.js'
import bcrypt from 'bcryptjs'
const router = Router()
// Liste des utilisateurs
router.get('/', async (_req, res) => {
    const { rows } = await pool.query('SELECT id, login, role FROM users')
    res.json(rows)
})
// Création d'un utilisateur
router.post('/', async (req, res) => {
    const { login, password } = req.body
    if (!login || !password) {
    return res.status(400).json({ error: 'Login et mot de passe requis' })
}
try {
    const hash = await bcrypt.hash(password, 10)
    await pool.query(
    'INSERT INTO users (login, password_hash) VALUES ($1, $2)',
    [login, hash]
    );
    res.status(201).json({ message: 'Utilisateur créé' })
} catch (err: any) {
    if (err.code === '23505') {
    res.status(409).json({ error: 'Login déjà existant' })
    } else {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' })
    }
}
})
export default router