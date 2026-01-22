/*
  Warnings:

  - You are about to drop the column `chairs_per_city_table` on the `Festival` table. All the data in the column will be lost.
  - You are about to drop the column `chairs_per_large_table` on the `Festival` table. All the data in the column will be lost.
  - You are about to drop the column `chairs_per_standard_table` on the `Festival` table. All the data in the column will be lost.
  - You are about to drop the column `city_tables` on the `Festival` table. All the data in the column will be lost.
  - You are about to drop the column `large_tables` on the `Festival` table. All the data in the column will be lost.
  - You are about to drop the column `small_tables` on the `Festival` table. All the data in the column will be lost.
  - You are about to drop the column `total_chairs` on the `Festival` table. All the data in the column will be lost.
  - You are about to drop the column `is_placed` on the `FestivalGame` table. All the data in the column will be lost.
  - You are about to drop the column `placed_at` on the `FestivalGame` table. All the data in the column will be lost.
  - You are about to drop the column `city_tables` on the `MapZone` table. All the data in the column will be lost.
  - You are about to drop the column `large_tables` on the `MapZone` table. All the data in the column will be lost.
  - You are about to drop the column `small_tables` on the `MapZone` table. All the data in the column will be lost.
  - You are about to drop the column `city_tables` on the `PriceZone` table. All the data in the column will be lost.
  - You are about to drop the column `large_tables` on the `PriceZone` table. All the data in the column will be lost.
  - You are about to drop the column `small_tables` on the `PriceZone` table. All the data in the column will be lost.
  - You are about to drop the column `total_tables` on the `PriceZone` table. All the data in the column will be lost.
  - You are about to drop the column `is_partner` on the `Reservant` table. All the data in the column will be lost.
  - You are about to drop the column `map_zone_id` on the `TableType` table. All the data in the column will be lost.
  - You are about to drop the column `nb_chairs` on the `TableType` table. All the data in the column will be lost.
  - You are about to drop the `GameTableAssignment` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `type` on the `Reservant` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `price_zone_id` to the `TableType` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ContactLog" DROP CONSTRAINT "ContactLog_reservation_id_fkey";

-- DropForeignKey
ALTER TABLE "FestivalGame" DROP CONSTRAINT "FestivalGame_reservation_id_fkey";

-- DropForeignKey
ALTER TABLE "GameTableAssignment" DROP CONSTRAINT "GameTableAssignment_festival_game_id_fkey";

-- DropForeignKey
ALTER TABLE "GameTableAssignment" DROP CONSTRAINT "GameTableAssignment_table_type_id_fkey";

-- DropForeignKey
ALTER TABLE "TableType" DROP CONSTRAINT "TableType_map_zone_id_fkey";

-- DropForeignKey
ALTER TABLE "ZoneReservation" DROP CONSTRAINT "ZoneReservation_price_zone_id_fkey";

-- DropForeignKey
ALTER TABLE "ZoneReservation" DROP CONSTRAINT "ZoneReservation_reservation_id_fkey";

-- DropIndex
DROP INDEX "TableType_map_zone_id_idx";

-- AlterTable
ALTER TABLE "Festival" DROP COLUMN "chairs_per_city_table",
DROP COLUMN "chairs_per_large_table",
DROP COLUMN "chairs_per_standard_table",
DROP COLUMN "city_tables",
DROP COLUMN "large_tables",
DROP COLUMN "small_tables",
DROP COLUMN "total_chairs";

-- AlterTable
ALTER TABLE "FestivalGame" DROP COLUMN "is_placed",
DROP COLUMN "placed_at",
ADD COLUMN     "allocated_tables" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "space_m2" DOUBLE PRECISION NOT NULL DEFAULT 4,
ADD COLUMN     "table_size" "TableSize" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "MapZone" DROP COLUMN "city_tables",
DROP COLUMN "large_tables",
DROP COLUMN "small_tables";

-- AlterTable
ALTER TABLE "PriceZone" DROP COLUMN "city_tables",
DROP COLUMN "large_tables",
DROP COLUMN "small_tables",
DROP COLUMN "total_tables";

-- AlterTable
ALTER TABLE "Reservant" DROP COLUMN "is_partner",
ADD COLUMN     "email" TEXT,
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "role" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TableType" DROP COLUMN "map_zone_id",
DROP COLUMN "nb_chairs",
ADD COLUMN     "price_zone_id" INTEGER NOT NULL,
ALTER COLUMN "nb_total" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "nb_available" SET DATA TYPE DOUBLE PRECISION;

-- DropTable
DROP TABLE "GameTableAssignment";

-- CreateIndex
CREATE INDEX "TableType_price_zone_id_idx" ON "TableType"("price_zone_id");

-- AddForeignKey
ALTER TABLE "ZoneReservation" ADD CONSTRAINT "ZoneReservation_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("reservation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoneReservation" ADD CONSTRAINT "ZoneReservation_price_zone_id_fkey" FOREIGN KEY ("price_zone_id") REFERENCES "PriceZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FestivalGame" ADD CONSTRAINT "FestivalGame_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("reservation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableType" ADD CONSTRAINT "TableType_price_zone_id_fkey" FOREIGN KEY ("price_zone_id") REFERENCES "PriceZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactLog" ADD CONSTRAINT "ContactLog_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("reservation_id") ON DELETE CASCADE ON UPDATE CASCADE;
