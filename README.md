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

// festivals/add
curl -k -X POST https://localhost:4000/api/festivals/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc2MzY1MTczNSwiZXhwIjoxNzYzNzM4MTM1fQ.CJS35rAB3tJGQ7-Me5T6ZNkeAae1tzSmWSTkcR9d-PE" \
  -d '{
    "name": "Montpellier Festival city",
    "logo": "logo.png",
    "location": "Place de la comédie",
    "total_tables": 345,
    "startDate": "2025-06-20T18:00:00.000Z",
    "endDate": "2025-06-21T02:00:00.000Z"
  }'

  // festivals/all
  curl -k -X GET https://localhost:4000/api/festivals/all \
  -H "Content-Type: application/json"