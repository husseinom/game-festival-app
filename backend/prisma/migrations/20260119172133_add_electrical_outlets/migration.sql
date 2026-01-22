/*
  Warnings:

  - Added the required column `nb_electrical_outlets` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "nb_electrical_outlets" INTEGER NOT NULL;
