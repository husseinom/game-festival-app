# game-festival-app
FullStack web application to manage and organize game festivals

curl:

// Connexion admin
curl -k -X POST https://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin"
  }'

--> Renvoie un token : "12345678"

// Me
curl -k -X GET https://localhost:4000/api/users/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 12345678"