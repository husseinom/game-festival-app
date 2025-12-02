# game-festival-app

**Lancer la base de donnée** : `sudo docker compose -f docker-compose.db.yml up --build`

**Executer le .prisma après une modification** (il faut d'abord lancer la BD) : `npx prisma migrate dev --name "nom_de_la_migration"`

**Lancer le back** : `npm run dev`

> ⚠️ **ATTENTION :** On respecte l'achirtecture propre du back SVP

## Routes
### User

**register**

`
curl -k -X POST https://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@test.com",
    "password": "admin",
    "role": "ADMIN"
  }'
`

**login**

`
curl -k -X POST https://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin"
  }'
`

&rarr; Renvoie un token : "12345678"

**me**

`
curl -k -X GET https://localhost:4000/api/users/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 12345678"
`

**admin/all**

`
curl -k -X GET https://localhost:4000/api/users/admin/all \
  -H "Authorization: Bearer 12345678"
`

### Festival

**festivals/add**

`
curl -k -X POST https://localhost:4000/api/festivals/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 12345678" \
  -d '{
    "name": "Montpellier Festival city",
    "logo": "logo.png",
    "location": "Place de la comédie",
    "total_tables": 345,
    "startDate": "2025-06-20T18:00:00.000Z",
    "endDate": "2025-06-21T02:00:00.000Z"
  }'
`

**festivals/all**

`
curl -k -X GET https://localhost:4000/api/festivals/all \
  -H "Content-Type: application/json"
`

**festivals/:id**

`
curl -k -X GET https://localhost:4000/api/festivals/1 \
  -H "Content-Type: application/json"
`

### Game Publisher

**game_publishers/add**

`
curl -k -X POST https://localhost:4000/api/game_publishers/add \
-H "Content-Type: application/json" \
-H "Authorization: Bearer 12345678" \
-d '{
  "name": "Ubisoft",
  "logo": "https://cdn.example.com/logos/ubisoft.png"
}'
`

**game_pubishers/all**  

`
curl -k -X GET https://localhost:4000/api/game_publishers/all \
  -H "Content-Type: application/json"
`

**game_publishers/:id**

`
curl -k -X GET https://localhost:4000/api/game_publishers/1 \
  -H "Content-Type: application/json"
`

### Game

# games/add

`
curl -k -X POST https://localhost:4000/api/games/add \
-H "Content-Type: application/json" \
-H "Authorization: Bearer 12345678" \
-d '{
  "game_publisher_id": 1,
  "name": "Catan",
  "type": "Board Game",
  "min_age": 10,
  "logo_url": "https://cdn.example.com/logos/catan.png"
}'
`

# games/all

`
curl -k -X GET https://localhost:4000/api/games/all \
  -H "Content-Type: application/json"
`

# games/:id

`
curl -k -X GET https://localhost:4000/api/games/1 \
  -H "Content-Type: application/json"
`