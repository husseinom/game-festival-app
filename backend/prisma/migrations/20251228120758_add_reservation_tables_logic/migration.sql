-- CreateTable
CREATE TABLE "ZoneReservation" (
    "id" SERIAL NOT NULL,
    "reservation_id" INTEGER NOT NULL,
    "price_zone_id" INTEGER NOT NULL,
    "table_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ZoneReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FestivalGame" (
    "id" SERIAL NOT NULL,
    "reservation_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,
    "map_zone_id" INTEGER,
    "copy_count" INTEGER NOT NULL DEFAULT 1,
    "allocated_tables" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FestivalGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nb_total" INTEGER NOT NULL,
    "nb_total_player" INTEGER NOT NULL,
    "map_zone_id" INTEGER NOT NULL,

    CONSTRAINT "TableType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" SERIAL NOT NULL,
    "game_publisher_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tel" TEXT,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactLog" (
    "id" SERIAL NOT NULL,
    "reservation_id" INTEGER NOT NULL,
    "contact_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "ContactLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ZoneReservation_reservation_id_price_zone_id_key" ON "ZoneReservation"("reservation_id", "price_zone_id");

-- AddForeignKey
ALTER TABLE "ZoneReservation" ADD CONSTRAINT "ZoneReservation_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("reservation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoneReservation" ADD CONSTRAINT "ZoneReservation_price_zone_id_fkey" FOREIGN KEY ("price_zone_id") REFERENCES "PriceZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FestivalGame" ADD CONSTRAINT "FestivalGame_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("reservation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FestivalGame" ADD CONSTRAINT "FestivalGame_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FestivalGame" ADD CONSTRAINT "FestivalGame_map_zone_id_fkey" FOREIGN KEY ("map_zone_id") REFERENCES "MapZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableType" ADD CONSTRAINT "TableType_map_zone_id_fkey" FOREIGN KEY ("map_zone_id") REFERENCES "MapZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_game_publisher_id_fkey" FOREIGN KEY ("game_publisher_id") REFERENCES "GamePublisher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactLog" ADD CONSTRAINT "ContactLog_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("reservation_id") ON DELETE RESTRICT ON UPDATE CASCADE;
