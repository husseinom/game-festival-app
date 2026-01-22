-- CreateTable
CREATE TABLE "Reservation" (
    "reservation_id" SERIAL NOT NULL,
    "game_publisher_id" INTEGER NOT NULL,
    "festival_id" INTEGER NOT NULL,
    "reservant_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "comments" TEXT,
    "is_publisher_presenting" BOOLEAN NOT NULL DEFAULT false,
    "game_list_requested" BOOLEAN NOT NULL DEFAULT false,
    "game_list_received" BOOLEAN NOT NULL DEFAULT false,
    "games_received" BOOLEAN NOT NULL DEFAULT false,
    "discount_amount" DOUBLE PRECISION,
    "discount_tables" INTEGER,
    "final_invoice_amount" DOUBLE PRECISION,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("reservation_id")
);

-- CreateIndex
CREATE INDEX "Reservation_game_publisher_id_idx" ON "Reservation"("game_publisher_id");

-- CreateIndex
CREATE INDEX "Reservation_festival_id_idx" ON "Reservation"("festival_id");

-- CreateIndex
CREATE INDEX "Reservation_reservant_id_idx" ON "Reservation"("reservant_id");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_game_publisher_id_fkey" FOREIGN KEY ("game_publisher_id") REFERENCES "Game_Publisher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "Festival"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_reservant_id_fkey" FOREIGN KEY ("reservant_id") REFERENCES "Reservant"("reservant_id") ON DELETE RESTRICT ON UPDATE CASCADE;
