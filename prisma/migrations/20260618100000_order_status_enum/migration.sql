-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('Pending', 'Paid', 'In Progress', 'Completed', 'Cancelled');

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus" USING ("status"::"OrderStatus");
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'Pending'::"OrderStatus";