/*
  Warnings:

  - You are about to drop the column `total_tables` on the `Festival` table. All the data in the column will be lost.
  - You are about to drop the `TableType` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TableType" DROP CONSTRAINT "TableType_map_zone_id_fkey";

-- AlterTable
ALTER TABLE "Festival" DROP COLUMN "total_tables",
ADD COLUMN     "city_tables" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "large_tables" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "small_tables" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MapZone" ADD COLUMN     "city_tables" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "large_tables" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "small_tables" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PriceZone" ADD COLUMN     "city_tables" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "large_tables" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "small_tables" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Reservation" ALTER COLUMN "nb_electrical_outlets" SET DEFAULT 0;

-- DropTable
DROP TABLE "TableType";
