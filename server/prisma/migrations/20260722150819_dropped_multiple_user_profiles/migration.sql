/*
  Warnings:

  - You are about to drop the `AdminProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StudentProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeacherProfile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AdminProfile" DROP CONSTRAINT "AdminProfile_branchId_fkey";

-- DropForeignKey
ALTER TABLE "AdminProfile" DROP CONSTRAINT "AdminProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "StudentEnrollment" DROP CONSTRAINT "StudentEnrollment_studentId_fkey";

-- DropForeignKey
ALTER TABLE "StudentGuardian" DROP CONSTRAINT "StudentGuardian_studentId_fkey";

-- DropForeignKey
ALTER TABLE "StudentProfile" DROP CONSTRAINT "StudentProfile_branchId_fkey";

-- DropForeignKey
ALTER TABLE "StudentProfile" DROP CONSTRAINT "StudentProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherAssignment" DROP CONSTRAINT "TeacherAssignment_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherProfile" DROP CONSTRAINT "TeacherProfile_branchId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherProfile" DROP CONSTRAINT "TeacherProfile_userId_fkey";

-- DropTable
DROP TABLE "AdminProfile";

-- DropTable
DROP TABLE "StudentProfile";

-- DropTable
DROP TABLE "TeacherProfile";

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "fathersName" TEXT NOT NULL,
    "mothersName" TEXT,
    "nationalId" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "photoUrl" TEXT,
    "notes" TEXT,
    "employeeNumber" TEXT,
    "registrationNumber" TEXT,
    "baseSalary" DECIMAL(12,2),
    "telegramChatId" TEXT,
    "hireDate" TIMESTAMP(3),
    "admissionDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_userId_idx" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_branchId_idx" ON "UserProfile"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_branchId_employeeNumber_key" ON "UserProfile"("branchId", "employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_branchId_registrationNumber_key" ON "UserProfile"("branchId", "registrationNumber");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardian" ADD CONSTRAINT "StudentGuardian_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
