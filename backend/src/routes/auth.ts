import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import {pool} from '../db/database.js'
import { verifyToken, createAccessToken, createRefreshToken } from '../midlleware/token-management.js'

const router = Router()
router.post('/login', async (req, res) => { // --- LOGIN ---
    const { login, password } = req.body
    if (!login || !password) // si pas de login ou password dans la requête => ERREUR : fin du login
        return res.status(400).json({ error: 'Identifiants manquants' })
    const { rows } = await pool.query('SELECT * FROM users WHERE login=$1', [login])// on récupère le user dans la BD
    const user = rows[0]
    if (!user) return res.status(401).json({ error: 'Utilisateur inconnu' }) // pas dans la base => ERREUR : fin du login
    const match = await bcrypt.compare(password, user.password_hash) // on vérifie le password
    if (!match) return res.status(401).json({ error: 'Mot de passe incorrect' })// si pas de match => ERREUR : fin du login
    const accessToken = createAccessToken({ id: user.id, role: user.role }) // création du token d'accès
    const refreshToken = createRefreshToken({ id: user.id, role: user.role }) // création du refresh token
    res.cookie('access_token', accessToken, { // --------------------------------- Cookies sécurisés pour le token d'accès
        httpOnly: true, secure: true, sameSite: 'strict', maxAge: 15 * 60 * 1000,
    })
    res.cookie('refresh_token', refreshToken, { // --------------------------------- Cookies sécurisés pour le refresh token
        httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    res.json({ message: 'Authentification réussie', user: { login: user.login, role: user.role } })//connexion successful
})
router.post('/logout', (_req, res) => { // --- LOGOUT ---
    res.clearCookie('access_token')
    res.clearCookie('refresh_token')
    res.json({ message: 'Déconnexion réussie' })
})
// ------ Exemple de route accessible uniquement avec un JWT valide ------
router.get('/me', verifyToken, (req: Express.Request, res) => {
    res.json({ message: 'Utilisateur authentifié', user: req.user, }) // req typée automatiquement => pas d'erreur dans VSCode
})

router.get('/whoami', verifyToken, (req, res) => {
    res.json({ user: req.user })
})
export default router