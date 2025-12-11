import type { UserToken } from './user-token.ts'
declare global {
    namespace Express { // on rajoute user au type Request de express
        interface Request {
            // pour aider VSCode (ds cookie-parser mais pas vu par VSCode)
            cookies?: Record<string, string>
            user?: UserToken // il peut y avoir un req.user
        }
    }
}
// Nécessaire pour que TypeScript traite ce fichier comme un module
export {}