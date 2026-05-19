/*
  Warnings:

  - A unique constraint covering the columns `[gateway_event_id]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "razorpay_order_id" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "gateway_event_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE INDEX "orders_user_id_order_status_payment_status_idx" ON "orders"("user_id", "order_status", "payment_status");

-- CreateIndex
CREATE INDEX "orders_razorpay_order_id_idx" ON "orders"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_gateway_event_id_key" ON "payments"("gateway_event_id");
