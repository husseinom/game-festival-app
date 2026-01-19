/*
  Warnings:

  - The `type` column on the `Reservant` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Reservation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updated_at` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nb_available` to the `TableType` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `name` on the `TableType` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('NOT_CONTACTED', 'CONTACTED', 'IN_DISCUSSION', 'CONFIRMED', 'ABSENT', 'CONSIDERED_ABSENT');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'INVOICED', 'PAID');

-- CreateEnum
CREATE TYPE "ReservantType" AS ENUM ('PUBLISHER', 'SHOP', 'ASSOCIATION', 'OTHER');

-- CreateEnum
CREATE TYPE "TableSize" AS ENUM ('STANDARD', 'LARGE', 'CITY');

-- AlterTable
ALTER TABLE "FestivalGame" ADD COLUMN     "is_received" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "received_at" TIMESTAMP(3),
ADD COLUMN     "table_size" "TableSize" NOT NULL DEFAULT 'STANDARD',
ALTER COLUMN "allocated_tables" SET DEFAULT 1,
ALTER COLUMN "allocated_tables" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Reservant" ADD COLUMN     "is_partner" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "type",
ADD COLUMN     "type" "ReservantType" NOT NULL DEFAULT 'PUBLISHER';

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "game_list_received_at" TIMESTAMP(3),
ADD COLUMN     "game_list_requested_at" TIMESTAMP(3),
ADD COLUMN     "games_received_at" TIMESTAMP(3),
ADD COLUMN     "invoice_status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "invoiced_at" TIMESTAMP(3),
ADD COLUMN     "large_table_request" TEXT,
ADD COLUMN     "needs_festival_animators" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ReservationStatus" NOT NULL DEFAULT 'NOT_CONTACTED',
ALTER COLUMN "nb_electrical_outlets" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "TableType" ADD COLUMN     "nb_available" INTEGER NOT NULL,
DROP COLUMN "name",
ADD COLUMN     "name" "TableSize" NOT NULL;

-- CreateIndex
CREATE INDEX "FestivalGame_reservation_id_idx" ON "FestivalGame"("reservation_id");

-- CreateIndex
CREATE INDEX "FestivalGame_game_id_idx" ON "FestivalGame"("game_id");

-- CreateIndex
CREATE INDEX "FestivalGame_map_zone_id_idx" ON "FestivalGame"("map_zone_id");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- CreateIndex
CREATE INDEX "Reservation_invoice_status_idx" ON "Reservation"("invoice_status");

-- CreateIndex
CREATE INDEX "TableType_map_zone_id_idx" ON "TableType"("map_zone_id");

-- CreateIndex
CREATE INDEX "TableType_name_idx" ON "TableType"("name");
