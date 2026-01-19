-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_game_publisher_id_fkey";

-- AlterTable
ALTER TABLE "Reservation" ALTER COLUMN "game_publisher_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_game_publisher_id_fkey" FOREIGN KEY ("game_publisher_id") REFERENCES "GamePublisher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
