/*
  Warnings:

  - A unique constraint covering the columns `[name,location,startDate]` on the table `Festival` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Festival_name_location_startDate_key" ON "Festival"("name", "location", "startDate");
