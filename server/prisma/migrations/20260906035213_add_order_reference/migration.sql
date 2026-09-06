/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reference` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "reference" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "orders_reference_key" ON "orders"("reference");
