/*
  Warnings:

  - A unique constraint covering the columns `[classroomId,dayOfWeek,schedulePeriodId]` on the table `TimetableEntry` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `classroomId` to the `TimetableEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SchedulePeriod" ADD COLUMN     "isBreak" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shortName" TEXT,
ALTER COLUMN "startTime" SET DATA TYPE TEXT,
ALTER COLUMN "endTime" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "TimetableEntry" ADD COLUMN     "classroomId" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "SchedulePeriod_branchId_idx" ON "SchedulePeriod"("branchId");

-- CreateIndex
CREATE INDEX "TimetableEntry_classroomId_idx" ON "TimetableEntry"("classroomId");

-- CreateIndex
CREATE INDEX "TimetableEntry_schedulePeriodId_idx" ON "TimetableEntry"("schedulePeriodId");

-- CreateIndex
CREATE INDEX "TimetableEntry_dayOfWeek_idx" ON "TimetableEntry"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "TimetableEntry_classroomId_dayOfWeek_schedulePeriodId_key" ON "TimetableEntry"("classroomId", "dayOfWeek", "schedulePeriodId");

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
