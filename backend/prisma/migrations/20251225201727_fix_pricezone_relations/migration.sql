/*
  Warnings:

  - You are about to drop the column `logo` on the `Festival` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Festival" DROP COLUMN "logo",
ADD COLUMN     "priceZoneTypeId" INTEGER;

-- CreateTable
CREATE TABLE "MapZone" (
    "id" SERIAL NOT NULL,
    "festival_id" INTEGER NOT NULL,
    "price_zone_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "MapZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceZoneType" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PriceZoneType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceZone" (
    "id" SERIAL NOT NULL,
    "festival_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "table_price" DOUBLE PRECISION NOT NULL,
    "total_tables" INTEGER,

    CONSTRAINT "PriceZone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriceZoneType_key_key" ON "PriceZoneType"("key");

-- AddForeignKey
ALTER TABLE "Festival" ADD CONSTRAINT "Festival_priceZoneTypeId_fkey" FOREIGN KEY ("priceZoneTypeId") REFERENCES "PriceZoneType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapZone" ADD CONSTRAINT "MapZone_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "Festival"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapZone" ADD CONSTRAINT "MapZone_price_zone_id_fkey" FOREIGN KEY ("price_zone_id") REFERENCES "PriceZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceZone" ADD CONSTRAINT "PriceZone_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "Festival"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
