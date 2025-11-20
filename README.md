# game-festival-app
FullStack web application to manage and organize game festivals

curl:

// register
curl -X POST https://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@test.com",
    "password": "admin",
    "role": "ADMIN"
  }'


// login
curl -k -X POST https://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin"
  }'

--> Renvoie un token : "12345678"

// me
curl -k -X GET https://localhost:4000/api/users/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 12345678"

// admin/all
curl -k -X GET https://localhost:4000/api/users/admin/all \
  -H "Authorization: Bearer TON_TOKEN_ADMIN"