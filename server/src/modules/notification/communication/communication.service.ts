// src/modules/communication/communication.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "@shared/errors/AppError";
import { telegramService } from "@shared/services/telegram.service";
import { CacheUtils } from "@shared/utils/cache.utils";

class CommunicationService {
  private async getGuardianTelegramChatIds(guardianId: string): Promise<string[]> {
    const chatIds: string[] = [];
    const links = await prisma.telegramLink.findMany({ where: { guardianId, isActive: true }, select: { chatId: true } });
    links.forEach(l => chatIds.push(l.chatId));
    if (chatIds.length === 0) {
      const guardian = await prisma.guardian.findUnique({ where: { id: guardianId }, select: { telegramChatId: true } });
      if (guardian?.telegramChatId) chatIds.push(guardian.telegramChatId);
    }
    return [...new Set(chatIds)];
  }

  async sendMessageToGuardian(teacherUserId: string, data: { studentId: string; guardianId: string; message: string }) {
    const teacherProfile = await prisma.userProfile.findUnique({ where: { userId: teacherUserId } });
    if (!teacherProfile) throw new AppError("Teacher profile not found.", 404);

    const hasAccess = await this.verifyTeacherStudentAccess(teacherProfile.id, data.studentId);
    if (!hasAccess) throw new AppError("You don't have access to this student.", 403);

    const guardian = await prisma.guardian.findUnique({ where: { id: data.guardianId }, include: { students: { where: { studentId: data.studentId } } } });
    if (!guardian) throw new AppError("Guardian not found.", 404);

    const chatIds = await this.getGuardianTelegramChatIds(data.guardianId);
    if (chatIds.length === 0) throw new AppError("Guardian does not have Telegram linked.", 400);

    const student = await prisma.userProfile.findUnique({ where: { id: data.studentId }, select: { fullName: true, registrationNumber: true } });

    const message = `📱 <b>Message from ${teacherProfile.fullName}</b>\n🏫 Imam Hassen Medresa\n\nStudent: ${student?.fullName} (${student?.registrationNumber})\n\n📝 ${data.message}\n\n_You are welcome to come to the school to contact the teacher in person._`;

    let status = "SENT"; let errorMessage: string | null = null;
    for (const chatId of chatIds) {
      try { await telegramService.sendMessage(chatId, message); status = "DELIVERED"; }
      catch (error: any) { status = "FAILED"; errorMessage = error.message; }
    }

    const savedMessage = await prisma.teacherGuardianMessage.create({ data: { teacherUserId, studentId: data.studentId, guardianId: data.guardianId, message: data.message, sentVia: "TELEGRAM", status, sentAt: new Date(), deliveredAt: status === "DELIVERED" ? new Date() : null, errorMessage } });

    // Invalidate message history cache
    await CacheUtils.delete(`messages:history:${teacherUserId}:${data.studentId}:${data.guardianId}`);

    return { id: savedMessage.id, status, sentAt: savedMessage.sentAt, guardian: guardian.fullName, student: student?.fullName };
  }

  async sendBulkMessageToGuardians(teacherUserId: string, data: { classroomId: string; message: string; guardianIds?: string[] }) {
    const teacherProfile = await prisma.userProfile.findUnique({ where: { userId: teacherUserId } });
    if (!teacherProfile) throw new AppError("Teacher profile not found.", 404);

    const isHomeroom = await prisma.homeroomTeacher.findFirst({ where: { teacherId: teacherProfile.id, classroomId: data.classroomId, isActive: true } });
    const teachesClass = await prisma.teacherAssignment.findFirst({ where: { teacherId: teacherProfile.id, classroomId: data.classroomId } });
    if (!isHomeroom && !teachesClass) throw new AppError("You don't have access to this classroom.", 403);

    const guardianWhere: any = { students: { some: { student: { studentEnrollments: { some: { classroomId: data.classroomId, isActive: true } } } } } };
    if (data.guardianIds?.length) guardianWhere.id = { in: data.guardianIds };

    const guardians = await prisma.guardian.findMany({ where: guardianWhere, include: { students: { where: { student: { studentEnrollments: { some: { classroomId: data.classroomId, isActive: true } } } }, include: { student: { select: { fullName: true } } } } } });
    if (guardians.length === 0) throw new AppError("No guardians found for this class.", 404);

    const message = `📱 <b>Message from ${teacherProfile.fullName}</b>\n🏫 Imam Hassen Medresa\nClass: ${isHomeroom ? 'Homeroom Teacher' : 'Subject Teacher'}\n\n📝 ${data.message}`;
    const results: { successful: number; failed: number } = { successful: 0, failed: 0 };

    for (const guardian of guardians) {
      const chatIds = await this.getGuardianTelegramChatIds(guardian.id);
      if (chatIds.length === 0) { results.failed++; continue; }

      const studentNames = guardian.students.map(s => s.student.fullName).join(', ');
      const personalizedMessage = `👋 Dear ${guardian.fullName},\n\nParent of: ${studentNames}\n\n${message}`;

      let sent = false;
      for (const chatId of chatIds) {
        try { await telegramService.sendMessage(chatId, personalizedMessage); sent = true; }
        catch (error: any) { /* try next */ }
      }

      if (sent) {
        results.successful++;
        for (const sg of guardian.students) {
          await prisma.teacherGuardianMessage.create({ data: { teacherUserId, studentId: sg.studentId, guardianId: guardian.id, message: data.message, sentVia: "TELEGRAM", status: "DELIVERED", sentAt: new Date(), deliveredAt: new Date() } });
        }
      } else { results.failed++; }
    }

    // Invalidate caches
    await CacheUtils.invalidatePattern('messages:history:*');

    return { message: `Sent to ${results.successful} guardians, ${results.failed} failed`, ...results, totalGuardians: guardians.length };
  }

  async getMessageHistory(teacherUserId: string, studentId: string, guardianId: string) {
    const cacheKey = `messages:history:${teacherUserId}:${studentId}:${guardianId}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const messages = await prisma.teacherGuardianMessage.findMany({
        where: { teacherUserId, studentId, guardianId },
        orderBy: { sentAt: "desc" }, take: 50,
        include: { guardian: { select: { fullName: true } }, student: { select: { fullName: true } } },
      });

      return messages.map(m => ({ id: m.id, message: m.message, status: m.status, sentAt: m.sentAt, guardian: m.guardian.fullName, student: m.student.fullName }));
    }, 60);
  }

  async getStudentGuardiansForTeacher(teacherUserId: string, studentId: string) {
    const teacherProfile = await prisma.userProfile.findUnique({ where: { userId: teacherUserId } });
    if (!teacherProfile) throw new AppError("Teacher profile not found.", 404);

    const hasAccess = await this.verifyTeacherStudentAccess(teacherProfile.id, studentId);
    if (!hasAccess) throw new AppError("You don't have access to this student.", 403);

    const cacheKey = `guardians:teacher:${teacherUserId}:student:${studentId}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const guardians = await prisma.guardian.findMany({ where: { students: { some: { studentId } } }, include: { students: { where: { studentId }, select: { isPrimary: true } } } });

      const guardianList = await Promise.all(guardians.map(async (g) => {
        const chatIds = await this.getGuardianTelegramChatIds(g.id);
        return { id: g.id, fullName: g.fullName, relationship: g.relationship, phone: g.phone, hasTelegram: chatIds.length > 0, isPrimary: g.students[0]?.isPrimary || false };
      }));

      return guardianList;
    }, 120);
  }

  private async verifyTeacherStudentAccess(teacherProfileId: string, studentId: string): Promise<boolean> {
    const studentEnrollment = await prisma.studentEnrollment.findFirst({ where: { studentId, isActive: true }, select: { classroomId: true } });
    if (!studentEnrollment) return false;

    const isHomeroom = await prisma.homeroomTeacher.findFirst({ where: { teacherId: teacherProfileId, classroomId: studentEnrollment.classroomId, isActive: true } });
    if (isHomeroom) return true;

    const teachesClass = await prisma.teacherAssignment.findFirst({ where: { teacherId: teacherProfileId, classroomId: studentEnrollment.classroomId } });
    return !!teachesClass;
  }
}

export const communicationService = new CommunicationService();