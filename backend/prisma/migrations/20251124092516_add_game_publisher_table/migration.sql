-- CreateTable
CREATE TABLE "Game_Publisher" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT NOT NULL,

    CONSTRAINT "Game_Publisher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_Publisher_name_key" ON "Game_Publisher"("name");
