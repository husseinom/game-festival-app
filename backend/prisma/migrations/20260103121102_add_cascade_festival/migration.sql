-- DropForeignKey
ALTER TABLE "MapZone" DROP CONSTRAINT "MapZone_festival_id_fkey";

-- DropForeignKey
ALTER TABLE "PriceZone" DROP CONSTRAINT "PriceZone_festival_id_fkey";

-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_festival_id_fkey";

-- AddForeignKey
ALTER TABLE "MapZone" ADD CONSTRAINT "MapZone_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "Festival"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceZone" ADD CONSTRAINT "PriceZone_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "Festival"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "Festival"("id") ON DELETE CASCADE ON UPDATE CASCADE;
