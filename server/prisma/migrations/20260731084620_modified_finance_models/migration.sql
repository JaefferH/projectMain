/*
  Warnings:

  - A unique constraint covering the columns `[voucherNumber]` on the table `Expense` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[branchId,name]` on the table `ExpenseCategory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[receiptNumber]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[receiptNumber]` on the table `Revenue` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[branchId,name]` on the table `RevenueCategory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[invoiceNumber]` on the table `StudentInvoice` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `receiptNumber` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invoiceNumber` to the `StudentInvoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `StudentInvoice` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SalaryComponentType" AS ENUM ('BASE_SALARY', 'BONUS', 'DEDUCTION', 'OVERTIME', 'ALLOWANCE', 'TAX', 'PENSION', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InvoiceStatus" ADD VALUE 'OVERDUE';
ALTER TYPE "InvoiceStatus" ADD VALUE 'WAIVED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentMethod" ADD VALUE 'CHEQUE';
ALTER TYPE "PaymentMethod" ADD VALUE 'CREDIT_CARD';
ALTER TYPE "PaymentMethod" ADD VALUE 'DEBIT_CARD';
ALTER TYPE "PaymentMethod" ADD VALUE 'ONLINE';
ALTER TYPE "PaymentMethod" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "voucherNumber" TEXT;

-- AlterTable
ALTER TABLE "ExpenseCategory" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "FeeStructure" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurringInterval" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "receiptNumber" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Revenue" ADD COLUMN     "receiptNumber" TEXT;

-- AlterTable
ALTER TABLE "RevenueCategory" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "StudentInvoice" ADD COLUMN     "discountReason" TEXT,
ADD COLUMN     "invoiceNumber" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalAmount" DECIMAL(12,2) NOT NULL;

-- CreateTable
CREATE TABLE "SalaryStructure" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "basicSalary" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryComponent" (
    "id" TEXT NOT NULL,
    "salaryStructureId" TEXT NOT NULL,
    "type" "SalaryComponentType" NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "isPercentage" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryPayment" (
    "id" TEXT NOT NULL,
    "salaryStructureId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "paymentPeriod" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "basicSalary" DECIMAL(12,2) NOT NULL,
    "totalAdditions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netSalary" DECIMAL(12,2) NOT NULL,
    "status" "SalaryStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod",
    "referenceNumber" TEXT,
    "paymentDate" TIMESTAMP(3),
    "processedByUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryPaymentDetail" (
    "id" TEXT NOT NULL,
    "salaryPaymentId" TEXT NOT NULL,
    "componentName" TEXT NOT NULL,
    "componentType" "SalaryComponentType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryPaymentDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialReport" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "academicYearId" TEXT,
    "reportType" TEXT NOT NULL,
    "reportPeriod" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalRevenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalExpenses" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalFeesCollected" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalSalaries" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "netIncome" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "generatedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalaryStructure_profileId_idx" ON "SalaryStructure"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryStructure_profileId_effectiveFrom_key" ON "SalaryStructure"("profileId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "SalaryComponent_salaryStructureId_idx" ON "SalaryComponent"("salaryStructureId");

-- CreateIndex
CREATE INDEX "SalaryPayment_profileId_idx" ON "SalaryPayment"("profileId");

-- CreateIndex
CREATE INDEX "SalaryPayment_branchId_idx" ON "SalaryPayment"("branchId");

-- CreateIndex
CREATE INDEX "SalaryPayment_status_idx" ON "SalaryPayment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryPayment_profileId_paymentPeriod_key" ON "SalaryPayment"("profileId", "paymentPeriod");

-- CreateIndex
CREATE INDEX "SalaryPaymentDetail_salaryPaymentId_idx" ON "SalaryPaymentDetail"("salaryPaymentId");

-- CreateIndex
CREATE INDEX "FinancialReport_branchId_idx" ON "FinancialReport"("branchId");

-- CreateIndex
CREATE INDEX "FinancialReport_reportPeriod_idx" ON "FinancialReport"("reportPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialReport_branchId_reportType_reportPeriod_key" ON "FinancialReport"("branchId", "reportType", "reportPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_voucherNumber_key" ON "Expense"("voucherNumber");

-- CreateIndex
CREATE INDEX "Expense_branchId_idx" ON "Expense"("branchId");

-- CreateIndex
CREATE INDEX "Expense_status_idx" ON "Expense"("status");

-- CreateIndex
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_branchId_name_key" ON "ExpenseCategory"("branchId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_receiptNumber_key" ON "Payment"("receiptNumber");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_receiptNumber_idx" ON "Payment"("receiptNumber");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "Payment"("paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "Revenue_receiptNumber_key" ON "Revenue"("receiptNumber");

-- CreateIndex
CREATE INDEX "Revenue_branchId_idx" ON "Revenue"("branchId");

-- CreateIndex
CREATE INDEX "Revenue_receivedDate_idx" ON "Revenue"("receivedDate");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueCategory_branchId_name_key" ON "RevenueCategory"("branchId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "StudentInvoice_invoiceNumber_key" ON "StudentInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "StudentInvoice_enrollmentId_idx" ON "StudentInvoice"("enrollmentId");

-- CreateIndex
CREATE INDEX "StudentInvoice_status_idx" ON "StudentInvoice"("status");

-- CreateIndex
CREATE INDEX "StudentInvoice_invoiceNumber_idx" ON "StudentInvoice"("invoiceNumber");

-- AddForeignKey
ALTER TABLE "SalaryStructure" ADD CONSTRAINT "SalaryStructure_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructure" ADD CONSTRAINT "SalaryStructure_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryComponent" ADD CONSTRAINT "SalaryComponent_salaryStructureId_fkey" FOREIGN KEY ("salaryStructureId") REFERENCES "SalaryStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryPayment" ADD CONSTRAINT "SalaryPayment_salaryStructureId_fkey" FOREIGN KEY ("salaryStructureId") REFERENCES "SalaryStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryPayment" ADD CONSTRAINT "SalaryPayment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryPayment" ADD CONSTRAINT "SalaryPayment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryPayment" ADD CONSTRAINT "SalaryPayment_processedByUserId_fkey" FOREIGN KEY ("processedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryPaymentDetail" ADD CONSTRAINT "SalaryPaymentDetail_salaryPaymentId_fkey" FOREIGN KEY ("salaryPaymentId") REFERENCES "SalaryPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialReport" ADD CONSTRAINT "FinancialReport_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialReport" ADD CONSTRAINT "FinancialReport_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialReport" ADD CONSTRAINT "FinancialReport_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
