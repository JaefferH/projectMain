/*
  Warnings:

  - You are about to drop the `AttendanceRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AttendanceSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "StudentAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'HALF_DAY');

-- CreateEnum
CREATE TYPE "StaffAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'EXCUSED');

-- DropForeignKey
ALTER TABLE "AttendanceRecord" DROP CONSTRAINT "AttendanceRecord_attendanceSessionId_fkey";

-- DropForeignKey
ALTER TABLE "AttendanceRecord" DROP CONSTRAINT "AttendanceRecord_enrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "AttendanceSession" DROP CONSTRAINT "AttendanceSession_teacherAssignmentId_fkey";

-- DropTable
DROP TABLE "AttendanceRecord";

-- DropTable
DROP TABLE "AttendanceSession";

-- DropEnum
DROP TYPE "AttendanceStatus";

-- CreateTable
CREATE TABLE "StudentAttendanceSession" (
    "id" TEXT NOT NULL,
    "homeroomTeacherId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "academicTermId" TEXT NOT NULL,
    "sessionDate" DATE NOT NULL,
    "topic" TEXT,
    "notes" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAttendanceRecord" (
    "id" TEXT NOT NULL,
    "attendanceSessionId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "status" "StudentAttendanceStatus" NOT NULL,
    "remarks" TEXT,
    "checkInTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAttendanceRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "attendanceDate" DATE NOT NULL,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "status" "StaffAttendanceStatus" NOT NULL,
    "remarks" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffAttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentAttendanceSession_homeroomTeacherId_idx" ON "StudentAttendanceSession"("homeroomTeacherId");

-- CreateIndex
CREATE INDEX "StudentAttendanceSession_classroomId_idx" ON "StudentAttendanceSession"("classroomId");

-- CreateIndex
CREATE INDEX "StudentAttendanceSession_sessionDate_idx" ON "StudentAttendanceSession"("sessionDate");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAttendanceSession_classroomId_sessionDate_key" ON "StudentAttendanceSession"("classroomId", "sessionDate");

-- CreateIndex
CREATE INDEX "StudentAttendanceRecord_enrollmentId_idx" ON "StudentAttendanceRecord"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAttendanceRecord_attendanceSessionId_enrollmentId_key" ON "StudentAttendanceRecord"("attendanceSessionId", "enrollmentId");

-- CreateIndex
CREATE INDEX "StaffAttendanceRecord_userId_idx" ON "StaffAttendanceRecord"("userId");

-- CreateIndex
CREATE INDEX "StaffAttendanceRecord_branchId_idx" ON "StaffAttendanceRecord"("branchId");

-- CreateIndex
CREATE INDEX "StaffAttendanceRecord_attendanceDate_idx" ON "StaffAttendanceRecord"("attendanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "StaffAttendanceRecord_profileId_attendanceDate_key" ON "StaffAttendanceRecord"("profileId", "attendanceDate");

-- AddForeignKey
ALTER TABLE "StudentAttendanceSession" ADD CONSTRAINT "StudentAttendanceSession_homeroomTeacherId_fkey" FOREIGN KEY ("homeroomTeacherId") REFERENCES "HomeroomTeacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendanceSession" ADD CONSTRAINT "StudentAttendanceSession_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendanceSession" ADD CONSTRAINT "StudentAttendanceSession_academicTermId_fkey" FOREIGN KEY ("academicTermId") REFERENCES "AcademicTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendanceRecord" ADD CONSTRAINT "StudentAttendanceRecord_attendanceSessionId_fkey" FOREIGN KEY ("attendanceSessionId") REFERENCES "StudentAttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendanceRecord" ADD CONSTRAINT "StudentAttendanceRecord_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "StudentEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendanceRecord" ADD CONSTRAINT "StaffAttendanceRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendanceRecord" ADD CONSTRAINT "StaffAttendanceRecord_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendanceRecord" ADD CONSTRAINT "StaffAttendanceRecord_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendanceRecord" ADD CONSTRAINT "StaffAttendanceRecord_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
