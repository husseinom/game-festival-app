-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "game_publisher_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "min_age" INTEGER NOT NULL,
    "logo_url" TEXT NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Game_game_publisher_id_idx" ON "Game"("game_publisher_id");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_game_publisher_id_fkey" FOREIGN KEY ("game_publisher_id") REFERENCES "Game_Publisher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
