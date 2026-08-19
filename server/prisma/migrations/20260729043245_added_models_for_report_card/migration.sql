/*
  Warnings:

  - Added the required column `academicTermId` to the `Assessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classroomId` to the `Assessment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "academicTermId" TEXT NOT NULL,
ADD COLUMN     "classroomId" TEXT NOT NULL,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "AssessmentResult" ADD COLUMN     "percentage" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "ReportCard" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "overallPercentage" DECIMAL(5,2),
    "overallGrade" TEXT,
    "rank" INTEGER,
    "remarks" TEXT,
    "homeroomRemarks" TEXT,
    "principalRemarks" TEXT,
    "isFinalized" BOOLEAN NOT NULL DEFAULT false,
    "finalizedAt" TIMESTAMP(3),
    "finalizedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportCardSubjectGrade" (
    "id" TEXT NOT NULL,
    "reportCardId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "academicTermId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "totalPercentage" DECIMAL(5,2) NOT NULL,
    "letterGrade" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportCardSubjectGrade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportCard_enrollmentId_idx" ON "ReportCard"("enrollmentId");

-- CreateIndex
CREATE INDEX "ReportCard_academicYearId_idx" ON "ReportCard"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCard_enrollmentId_academicYearId_key" ON "ReportCard"("enrollmentId", "academicYearId");

-- CreateIndex
CREATE INDEX "ReportCardSubjectGrade_reportCardId_idx" ON "ReportCardSubjectGrade"("reportCardId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCardSubjectGrade_reportCardId_subjectId_academicTermI_key" ON "ReportCardSubjectGrade"("reportCardId", "subjectId", "academicTermId");

-- CreateIndex
CREATE INDEX "Assessment_classroomId_idx" ON "Assessment"("classroomId");

-- CreateIndex
CREATE INDEX "Assessment_academicTermId_idx" ON "Assessment"("academicTermId");

-- CreateIndex
CREATE INDEX "AssessmentResult_enrollmentId_idx" ON "AssessmentResult"("enrollmentId");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_academicTermId_fkey" FOREIGN KEY ("academicTermId") REFERENCES "AcademicTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "StudentEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_finalizedBy_fkey" FOREIGN KEY ("finalizedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCardSubjectGrade" ADD CONSTRAINT "ReportCardSubjectGrade_reportCardId_fkey" FOREIGN KEY ("reportCardId") REFERENCES "ReportCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCardSubjectGrade" ADD CONSTRAINT "ReportCardSubjectGrade_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCardSubjectGrade" ADD CONSTRAINT "ReportCardSubjectGrade_academicTermId_fkey" FOREIGN KEY ("academicTermId") REFERENCES "AcademicTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCardSubjectGrade" ADD CONSTRAINT "ReportCardSubjectGrade_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
