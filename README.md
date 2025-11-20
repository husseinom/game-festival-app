# game-festival-app
FullStack web application to manage and organize game festivals

curl:

// Register
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@test.com",
    "password": "admin",
    "role": "ADMIN"
  }'


// Connection
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