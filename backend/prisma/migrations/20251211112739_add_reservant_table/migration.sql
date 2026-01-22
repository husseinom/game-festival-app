-- CreateTable
CREATE TABLE "Reservant" (
    "reservant_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Reservant_pkey" PRIMARY KEY ("reservant_id")
);
