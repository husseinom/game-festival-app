/*
  Warnings:

  - The values [OTHER] on the enum `ReservantType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `allocated_tables` on the `FestivalGame` table. All the data in the column will be lost.
  - You are about to drop the column `table_size` on the `FestivalGame` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "GameSize" AS ENUM ('SMALL', 'STANDARD', 'LARGE');

-- AlterEnum
BEGIN;
CREATE TYPE "ReservantType_new" AS ENUM ('PUBLISHER', 'PROVIDER', 'SHOP', 'ASSOCIATION', 'ANIMATION');
ALTER TABLE "public"."Reservant" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Reservant" ALTER COLUMN "type" TYPE "ReservantType_new" USING ("type"::text::"ReservantType_new");
ALTER TYPE "ReservantType" RENAME TO "ReservantType_old";
ALTER TYPE "ReservantType_new" RENAME TO "ReservantType";
DROP TYPE "public"."ReservantType_old";
ALTER TABLE "Reservant" ALTER COLUMN "type" SET DEFAULT 'PUBLISHER';
COMMIT;

-- AlterTable
ALTER TABLE "Festival" ADD COLUMN     "chairs_per_city_table" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "chairs_per_large_table" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "chairs_per_standard_table" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "total_chairs" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "FestivalGame" DROP COLUMN "allocated_tables",
DROP COLUMN "table_size",
ADD COLUMN     "game_size" "GameSize" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "is_placed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "placed_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ZoneReservation" ADD COLUMN     "space_m2" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TableType" (
    "id" SERIAL NOT NULL,
    "name" "TableSize" NOT NULL,
    "nb_total" INTEGER NOT NULL,
    "nb_available" INTEGER NOT NULL,
    "nb_total_player" INTEGER NOT NULL,
    "nb_chairs" INTEGER NOT NULL DEFAULT 4,
    "map_zone_id" INTEGER NOT NULL,

    CONSTRAINT "TableType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameTableAssignment" (
    "id" SERIAL NOT NULL,
    "festival_game_id" INTEGER NOT NULL,
    "table_type_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "chairs_used" INTEGER NOT NULL DEFAULT 4,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameTableAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TableType_map_zone_id_idx" ON "TableType"("map_zone_id");

-- CreateIndex
CREATE INDEX "TableType_name_idx" ON "TableType"("name");

-- CreateIndex
CREATE INDEX "GameTableAssignment_festival_game_id_idx" ON "GameTableAssignment"("festival_game_id");

-- CreateIndex
CREATE INDEX "GameTableAssignment_table_type_id_idx" ON "GameTableAssignment"("table_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "GameTableAssignment_festival_game_id_table_type_id_key" ON "GameTableAssignment"("festival_game_id", "table_type_id");

-- AddForeignKey
ALTER TABLE "TableType" ADD CONSTRAINT "TableType_map_zone_id_fkey" FOREIGN KEY ("map_zone_id") REFERENCES "MapZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameTableAssignment" ADD CONSTRAINT "GameTableAssignment_festival_game_id_fkey" FOREIGN KEY ("festival_game_id") REFERENCES "FestivalGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameTableAssignment" ADD CONSTRAINT "GameTableAssignment_table_type_id_fkey" FOREIGN KEY ("table_type_id") REFERENCES "TableType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
