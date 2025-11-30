/*
  Warnings:

  - A unique constraint covering the columns `[name,game_publisher_id]` on the table `Game` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Game_name_game_publisher_id_key" ON "Game"("name", "game_publisher_id");
