/*
  Warnings:

  - You are about to drop the column `razorpay_payment_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `razorpay_refund_id` on the `orders` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "orders_razorpay_payment_id_idx";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "razorpay_payment_id",
DROP COLUMN "razorpay_refund_id";
