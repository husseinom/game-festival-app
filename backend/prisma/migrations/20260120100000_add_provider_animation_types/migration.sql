-- AlterEnum: Ajouter PROVIDER et ANIMATION

-- Ajouter les nouveaux types (la migration des données se fera via un script séparé)
ALTER TYPE "ReservantType" ADD VALUE IF NOT EXISTS 'PROVIDER';
ALTER TYPE "ReservantType" ADD VALUE IF NOT EXISTS 'ANIMATION';
