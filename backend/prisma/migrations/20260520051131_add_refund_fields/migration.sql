-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "razorpay_refund_id" TEXT,
ADD COLUMN     "refunded_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "orders_razorpay_payment_id_idx" ON "orders"("razorpay_payment_id");
