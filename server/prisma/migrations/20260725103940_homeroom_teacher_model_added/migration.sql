-- CreateTable
CREATE TABLE "HomeroomTeacher" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "academicTermId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeroomTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomeroomTeacher_teacherId_idx" ON "HomeroomTeacher"("teacherId");

-- CreateIndex
CREATE INDEX "HomeroomTeacher_classroomId_idx" ON "HomeroomTeacher"("classroomId");

-- CreateIndex
CREATE INDEX "HomeroomTeacher_academicTermId_idx" ON "HomeroomTeacher"("academicTermId");

-- CreateIndex
CREATE UNIQUE INDEX "HomeroomTeacher_classroomId_academicTermId_key" ON "HomeroomTeacher"("classroomId", "academicTermId");

-- CreateIndex
CREATE UNIQUE INDEX "HomeroomTeacher_teacherId_academicTermId_key" ON "HomeroomTeacher"("teacherId", "academicTermId");

-- AddForeignKey
ALTER TABLE "HomeroomTeacher" ADD CONSTRAINT "HomeroomTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeroomTeacher" ADD CONSTRAINT "HomeroomTeacher_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeroomTeacher" ADD CONSTRAINT "HomeroomTeacher_academicTermId_fkey" FOREIGN KEY ("academicTermId") REFERENCES "AcademicTerm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
