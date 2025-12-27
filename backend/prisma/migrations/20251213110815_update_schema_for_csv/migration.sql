/*
  Warnings:

  - You are about to drop the column `game_publisher_id` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `logo_url` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `max_players` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `min_age` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the `Game_Publisher` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_game_publisher_id_fkey";

-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_game_publisher_id_fkey";

-- DropIndex
DROP INDEX "Game_game_publisher_id_idx";

-- DropIndex
DROP INDEX "Game_name_game_publisher_id_key";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "game_publisher_id",
DROP COLUMN "logo_url",
DROP COLUMN "max_players",
DROP COLUMN "min_age",
DROP COLUMN "type",
ADD COLUMN     "author" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "maxPlayers" INTEGER,
ADD COLUMN     "minAge" INTEGER,
ADD COLUMN     "minPlayers" INTEGER,
ADD COLUMN     "noticeUrl" TEXT,
ADD COLUMN     "prototype" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publisherId" INTEGER,
ADD COLUMN     "theme" TEXT,
ADD COLUMN     "typeId" INTEGER,
ADD COLUMN     "videoUrl" TEXT;

-- DropTable
DROP TABLE "Game_Publisher";

-- CreateTable
CREATE TABLE "GamePublisher" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "exposant" BOOLEAN NOT NULL DEFAULT false,
    "distributeur" BOOLEAN NOT NULL DEFAULT false,
    "logoUrl" TEXT,

    CONSTRAINT "GamePublisher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameType" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "GameType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameMechanism" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "GameMechanism_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GameToGameMechanism" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_GameToGameMechanism_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_GameToGameMechanism_B_index" ON "_GameToGameMechanism"("B");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "GamePublisher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "GameType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_game_publisher_id_fkey" FOREIGN KEY ("game_publisher_id") REFERENCES "GamePublisher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameToGameMechanism" ADD CONSTRAINT "_GameToGameMechanism_A_fkey" FOREIGN KEY ("A") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameToGameMechanism" ADD CONSTRAINT "_GameToGameMechanism_B_fkey" FOREIGN KEY ("B") REFERENCES "GameMechanism"("id") ON DELETE CASCADE ON UPDATE CASCADE;
