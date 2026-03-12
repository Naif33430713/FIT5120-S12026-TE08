/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[google_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `google_id` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "firstName",
DROP COLUMN "id",
DROP COLUMN "lastName",
DROP COLUMN "phone",
DROP COLUMN "role",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "google_id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "user_id" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("user_id");

-- CreateTable
CREATE TABLE "Reminder" (
    "reminder_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "interval_minutes" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "next_trigger_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("reminder_id")
);

-- CreateTable
CREATE TABLE "UVGuidance" (
    "guidance_id" SERIAL NOT NULL,
    "uv_min" DOUBLE PRECISION NOT NULL,
    "uv_max" DOUBLE PRECISION NOT NULL,
    "risk_level" TEXT NOT NULL,
    "human_alert_template" TEXT NOT NULL,
    "clothing_text" TEXT NOT NULL,
    "sunscreen_dosage_text" TEXT NOT NULL,
    "reapply_minutes" INTEGER NOT NULL,

    CONSTRAINT "UVGuidance_pkey" PRIMARY KEY ("guidance_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_google_id_key" ON "User"("google_id");

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
