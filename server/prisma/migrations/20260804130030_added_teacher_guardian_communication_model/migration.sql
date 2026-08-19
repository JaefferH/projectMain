-- CreateTable
CREATE TABLE "TeacherGuardianMessage" (
    "id" TEXT NOT NULL,
    "teacherUserId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sentVia" TEXT NOT NULL DEFAULT 'TELEGRAM',
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherGuardianMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherGuardianMessage_teacherUserId_idx" ON "TeacherGuardianMessage"("teacherUserId");

-- CreateIndex
CREATE INDEX "TeacherGuardianMessage_studentId_idx" ON "TeacherGuardianMessage"("studentId");

-- CreateIndex
CREATE INDEX "TeacherGuardianMessage_guardianId_idx" ON "TeacherGuardianMessage"("guardianId");

-- CreateIndex
CREATE INDEX "TeacherGuardianMessage_sentAt_idx" ON "TeacherGuardianMessage"("sentAt");

-- AddForeignKey
ALTER TABLE "TeacherGuardianMessage" ADD CONSTRAINT "TeacherGuardianMessage_teacherUserId_fkey" FOREIGN KEY ("teacherUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherGuardianMessage" ADD CONSTRAINT "TeacherGuardianMessage_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherGuardianMessage" ADD CONSTRAINT "TeacherGuardianMessage_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE CASCADE ON UPDATE CASCADE;
