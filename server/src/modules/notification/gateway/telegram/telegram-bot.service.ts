// src/modules/notification/gateway/telegram/telegram-bot.service.ts
import { prisma } from "@config/prisma";
import { telegramService } from "../../../../shared/services/telegram.service";
import { TelegramLinkUtils } from "@shared/utils/telegram-link.utils";

class TelegramBotService {
  /**
   * Process incoming updates from Telegram
   */
  async processUpdate(update: any) {
    if (update.message) {
      await this.handleMessage(update.message);
    } else if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
    }
  }

  /**
   * Handle text messages
   */
  private async handleMessage(message: any) {
    const chatId = message.chat.id.toString();
    const text = (message.text || '').trim();
    const command = text.split(' ')[0].toLowerCase();

    // Get user profile if linked
    const profile = await this.getLinkedProfile(chatId);
    const userRoles: string[] = profile?.user?.role?.map((r: any) => r.role.name) || [];

    switch (command) {
      case '/start':
        await this.handleStartCommand(chatId, text);
        break;
      case '/link':
        await this.handleLinkCommand(chatId, text);
        break;
      case '/status':
        await this.handleStatusCommand(chatId, profile);
        break;
      case '/menu':                    // ADD THIS
        await this.handleMenuCommand(chatId);
        break;
      case '/help':
        await this.handleHelpCommand(chatId, userRoles);
        break;

      // Student commands
      case '/grades':
        if (this.isStudent(userRoles)) await this.handleStudentGrades(chatId, profile!);
        else await this.handleFeesCommand(chatId, profile!);
        break;
      case '/fees':
        await this.handleFeesCommand(chatId, profile);
        break;
      case '/timetable':
        await this.handleTimetableCommand(chatId, profile, userRoles);
        break;
      case '/attendance':
        await this.handleAttendanceCommand(chatId, profile, userRoles);
        break;
      case '/assignments':
        await this.handleAssignmentsCommand(chatId, profile, userRoles);
        break;
      case '/reportcard':
        await this.handleReportCardCommand(chatId, profile, userRoles);
        break;

      case '/children':
      await this.handleChildrenCommand(chatId);
      break;
    case '/child_grades':
      await this.handleChildGradesCommand(chatId);
      break;
    case '/child_fees':
      await this.handleChildFeesCommand(chatId);
      break;
    case '/child_attendance':
      await this.handleChildAttendanceCommand(chatId);
      break;
      // Teacher/Staff commands
      case '/myclass':
        if (this.isTeacher(userRoles)) await this.handleMyClassCommand(chatId, profile!);
        else await telegramService.sendMessage(chatId, '❌ This command is for teachers only.');
        break;
      case '/salary':
        if (this.isStaff(userRoles)) await this.handleSalaryCommand(chatId, profile!);
        else await telegramService.sendMessage(chatId, '❌ This command is for staff only.');
        break;

      // Admin commands
      case '/overview':
        if (this.isAdmin(userRoles)) await this.handleOverviewCommand(chatId);
        else await telegramService.sendMessage(chatId, '❌ This command is for admins only.');
        break;

      default:
        await telegramService.sendMessage(chatId,
          '❓ Unknown command. Type /help to see available commands.'
        );
    }
  }

  // Add these helper methods to the class:

/**
 * Get linked profiles from new TelegramLink system
 */
private async getLinkedProfilesNew(chatId: string) {
  return prisma.telegramLink.findMany({
    where: { chatId, isActive: true },
    include: {
      user: {
        include: {
          profile: true,
          role: { include: { role: true } },
        },
      },
      guardian: {
        include: {
          students: {
            include: { student: { select: { id: true, fullName: true, registrationNumber: true } } },
          },
        },
      },
    },
  });
}

/**
 * Get linked profile from legacy system
 */
private async getLinkedProfileLegacy(chatId: string) {
  return prisma.userProfile.findFirst({
    where: { telegramChatId: chatId },
    include: { user: { include: { role: { include: { role: true } } } } },
  });
}

/**
 * Check if user has a specific role
 */
private hasRole(links: any[], role: string): boolean {
  for (const link of links) {
    if (link.user?.role?.some((r: any) => r.role.name.includes(role))) return true;
  }
  return false;
}

/**
 * Handle /menu command
 */
private async handleMenuCommand(chatId: string) {
  const links = await this.getLinkedProfilesNew(chatId);

  if (links.length === 0) {
    // Check legacy
    const profile = await this.getLinkedProfileLegacy(chatId);
    if (profile) {
      await telegramService.sendMessage(chatId, 
        '📋 Use /help to see available commands for your profile.'
      );
      return;
    }
    await telegramService.sendMessage(chatId, '❌ No profiles linked. Use /start to get started.');
    return;
  }

  let message = `📋 <b>Available Commands</b>\n\n`;
  let hasCommands = false;

  const hasStudent = links.some(l => l.linkType === "STUDENT");
  const hasGuardian = links.some(l => l.linkType === "GUARDIAN");
  const hasStaff = links.some(l => l.linkType === "STAFF");

  if (hasStudent) {
    message += `📚 <b>Student:</b>\n`;
    message += `/grades - View grades\n`;
    message += `/fees - Fee status\n`;
    message += `/timetable - Schedule\n`;
    message += `/attendance - Attendance\n`;
    message += `/assignments - Subjects\n`;
    message += `\n`;
    hasCommands = true;
  }

  if (hasGuardian) {
    message += `👨‍👩‍👧 <b>Guardian:</b>\n`;
    message += `/children - Your children\n`;
    message += `/child_grades - Their grades\n`;
    message += `/child_fees - Their fees\n`;
    message += `/child_attendance - Their attendance\n`;
    message += `\n`;
    hasCommands = true;
  }

  if (hasStaff) {
    message += `👨‍🏫 <b>Staff:</b>\n`;
    message += `/timetable - Schedule\n`;
    message += `/myclass - Homeroom\n`;
    message += `/salary - Salary\n`;
    message += `/attendance - Attendance\n`;
    message += `\n`;
    hasCommands = true;
  }

  if (!hasCommands) {
    message += 'Use /help to see all commands.\n';
  }

  message += `/status - All profiles\n`;
  message += `/help - Help\n`;

  await telegramService.sendMessage(chatId, message);
}

  /**
   * Handle callback queries (inline buttons)
   */
  private async handleCallbackQuery(callbackQuery: any) {
    const chatId = callbackQuery.message.chat.id.toString();
    const data = callbackQuery.data;

    const profile = await this.getLinkedProfile(chatId);
    if (!profile) {
      await telegramService.sendMessage(chatId, '❌ Account not linked. Use /link YOUR_CODE to connect.');
      return;
    }

    const userRoles = profile.user.role.map((r: any) => r.role.name);

    switch (data) {
      case 'my_grades': await this.handleStudentGrades(chatId, profile); break;
      case 'my_fees': await this.handleFeesCommand(chatId, profile); break;
      case 'my_timetable': await this.handleTimetableCommand(chatId, profile, userRoles); break;
      case 'my_attendance': await this.handleAttendanceCommand(chatId, profile, userRoles); break;
      case 'my_assignments': await this.handleAssignmentsCommand(chatId, profile, userRoles); break;
      case 'my_reportcard': await this.handleReportCardCommand(chatId, profile, userRoles); break;
      case 'my_class': await this.handleMyClassCommand(chatId, profile); break;
      case 'my_salary': await this.handleSalaryCommand(chatId, profile); break;
    }
  }

  // ==================== HELPER METHODS ====================

  private async getLinkedProfile(chatId: string) {
    // First check TelegramLink model
    const link = await prisma.telegramLink.findFirst({
      where: { chatId, isActive: true },
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          include: {
            profile: true,
            role: { include: { role: true } },
          },
        },
        guardian: {
          include: {
            students: {
              include: { student: { select: { id: true, fullName: true, registrationNumber: true } } },
            },
          },
        },
      },
    });

    if (link?.user) {
      return link.user.profile;
    }

    // Fallback to legacy telegramChatId lookup
    return prisma.userProfile.findFirst({
      where: { telegramChatId: chatId },
      include: { user: { include: { role: { include: { role: true } } } } },
    });
  }

  private isStudent(roles: string[]): boolean {
    return roles.includes('STUDENT') && !roles.includes('TEACHER') && !roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN');
  }

  private isTeacher(roles: string[]): boolean {
    return roles.includes('TEACHER') || roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
  }

  private isStaff(roles: string[]): boolean {
    return roles.includes('TEACHER') || roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
  }

  private isAdmin(roles: string[]): boolean {
    return roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
  }

  // ==================== COMMAND HANDLERS ====================

  /**
   * /start command
   */
  private async handleStartCommand(chatId: string, text: string) {
  // Check if already linked via TelegramLink (new system)
  const links = await prisma.telegramLink.findMany({
    where: { chatId, isActive: true },
    include: {
      user: {
        include: {
          profile: true,
          role: { include: { role: true } },
        },
      },
      guardian: {
        include: {
          students: {
            include: { student: { select: { fullName: true } } },
          },
        },
      },
    },
  });

  if (links.length > 0) {
    // User has linked profiles via new system
    let message = `👋 Welcome back!\n\n<b>Your Linked Profiles:</b>\n\n`;
    
    for (const link of links) {
      if (link.linkType === "STUDENT" && link.user?.profile) {
        message += `📚 Student: ${link.user.profile.fullName}\n`;
      } else if (link.linkType === "STAFF" && link.user?.profile) {
        message += `👨‍🏫 Staff: ${link.user.profile.fullName}\n`;
      } else if (link.linkType === "GUARDIAN" && link.guardian) {
        const studentNames = link.guardian.students?.map(s => s.student.fullName).join(', ') || 'No students';
        message += `👨‍👩‍👧 Guardian: ${link.guardian.fullName} (Parent of: ${studentNames})\n`;
      }
    }
    
    message += `\nType /menu to see available commands.`;
    await telegramService.sendMessage(chatId, message);
    return;
  }

  // Fallback to legacy lookup
  const existingProfile = await prisma.userProfile.findFirst({
    where: { telegramChatId: chatId },
    include: { user: { include: { role: { include: { role: true } } } } },
  });

  if (existingProfile?.user) {
    const roles = existingProfile.user.role?.map(r => r.role.name) || [];
    await telegramService.sendMessage(chatId,
      `👋 Welcome back, <b>${existingProfile.fullName}</b>!\n\n` +
      `You are linked as: <b>${roles.join(', ') || 'User'}</b>\n\n` +
      `📋 Available commands:\n` +
      `/status - Your profile\n` +
      `/timetable - Your schedule\n` +
      `/help - All commands`
    );
    return;
  }

  // No linked profiles - show welcome message
  const parts = text.split(' ');
  if (parts.length > 1 && parts[1].startsWith('link_')) {
    await this.linkAccount(chatId, parts[1].replace('link_', ''));
    return;
  }

  await telegramService.sendMessage(chatId,
    `👋 Welcome to <b>Imam Hassen SMS</b>!\n\n` +
    `To link your account:\n` +
    `1️⃣ Login to your portal\n` +
    `2️⃣ Go to Settings > Telegram\n` +
    `3️⃣ Copy your link code\n` +
    `4️⃣ Send: <code>/link YOUR_CODE</code>\n\n` +
    `Type /help for more information.`
  );
}

  /**
   * /link command
   */
  private async handleLinkCommand(chatId: string, text: string) {
    const parts = text.split(' ');
    if (parts.length < 2) {
      await telegramService.sendMessage(chatId,
        '❌ Please provide your link code.\n\n' +
        'Example: <code>/link ABC123</code>\n\n' +
        'Get your code from: Portal > Settings > Telegram'
      );
      return;
    }
    await this.linkAccount(chatId, parts[1]);
  }

  private async linkAccount(chatId: string, linkCode: string) {
  // Check if it's a guardian code
  if (linkCode.startsWith('GUA-')) {
    await this.linkGuardianAccount(chatId, linkCode);
    return;
  }

  // Link as student/staff
  const userId = await TelegramLinkUtils.verifyLinkCode(linkCode);

  if (!userId) {
    await telegramService.sendMessage(chatId,
      '❌ Invalid or expired link code.\n\n' +
      'Generate a new code from your portal and try again.'
    );
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      role: { include: { role: true } },
    },
  });

  if (!user) {
    await telegramService.sendMessage(chatId, '❌ User not found.');
    return;
  }

  // Check if already linked via TelegramLink
  const existingLink = await prisma.telegramLink.findFirst({
    where: { chatId, userId, linkType: { in: ["STUDENT", "STAFF"] } },
  });

  if (existingLink) {
    await telegramService.sendMessage(chatId, '✅ This account is already linked.');
    return;
  }

  const roles = user.role.map(r => r.role.name);
  const linkType = roles.includes("STUDENT") && !roles.includes("TEACHER") && !roles.includes("ADMIN") && !roles.includes("SUPER_ADMIN") 
    ? "STUDENT" : "STAFF";

  // Save to new TelegramLink model
  await prisma.telegramLink.create({
    data: { chatId, linkType, userId },
  });

  // ALSO update legacy field for backward compatibility
  if (user.profile) {
    await prisma.userProfile.update({
      where: { userId },
      data: { telegramChatId: chatId },
    });
  } else {
    await prisma.userProfile.upsert({
      where: { userId },
      update: { telegramChatId: chatId },
      create: {
        userId,
        branchId: user.branchId || 'default',
        fullName: user.username,
        fathersName: 'N/A',
        telegramChatId: chatId,
      },
    });
  }

  const displayName = user.profile?.fullName || user.username;

  await telegramService.sendMessage(chatId,
    `✅ Successfully linked as <b>${linkType}</b>!\n\n` +
    `Welcome, <b>${displayName}</b>!\n\n` +
    `Type /help to see available commands.`
  );
}

// Add new method for guardian linking:
private async linkGuardianAccount(chatId: string, code: string) {
  const guardianData = guardianLinkCodes.get(code);
  
  if (!guardianData || new Date() > guardianData.expiresAt) {
    guardianLinkCodes.delete(code);
    await telegramService.sendMessage(chatId, '❌ Invalid or expired guardian link code.');
    return;
  }

  const guardian = await prisma.guardian.findUnique({
    where: { id: guardianData.guardianId },
    include: {
      students: {
        include: { student: { select: { fullName: true } } },
      },
    },
  });

  if (!guardian) {
    await telegramService.sendMessage(chatId, '❌ Guardian not found.');
    return;
  }

  // Check if already linked via TelegramLink
  const existingLink = await prisma.telegramLink.findFirst({
    where: { chatId, guardianId: guardian.id, linkType: "GUARDIAN" },
  });

  if (existingLink) {
    await telegramService.sendMessage(chatId, '✅ This guardian account is already linked.');
    return;
  }

  // Save to new TelegramLink model
  await prisma.telegramLink.create({
    data: { chatId, linkType: "GUARDIAN", guardianId: guardian.id },
  });

  // ALSO update legacy field for backward compatibility
  await prisma.guardian.update({
    where: { id: guardian.id },
    data: { telegramChatId: chatId },
  });

  // Consume the code
  guardianLinkCodes.delete(code);

  const studentNames = guardian.students.map(s => s.student.fullName).join(', ');

  await telegramService.sendMessage(chatId,
    `✅ Successfully linked as guardian!\n\n` +
    `Welcome, <b>${guardian.fullName}</b>!\n` +
    `Parent of: ${studentNames}\n\n` +
    `Type /menu to see available commands.\n` +
    `Type /help for all commands.`
  );
}

  /**
   * /status command
   */
  private async handleStatusCommand(chatId: string) {
  // Check TelegramLink first
  const links = await prisma.telegramLink.findMany({
    where: { chatId, isActive: true },
    include: {
      user: {
        include: {
          profile: true,
          role: { include: { role: true } },
        },
      },
      guardian: {
        include: {
          students: {
            include: { student: { select: { fullName: true, registrationNumber: true } } },
          },
        },
      },
    },
  });

  if (links.length > 0) {
    let message = `👤 <b>Your Linked Profiles</b>\n\n`;
    
    for (const link of links) {
      if (link.linkType === "STUDENT" && link.user?.profile) {
        const p = link.user.profile;
        message += `📚 <b>Student:</b> ${p.fullName}\n`;
        message += `   Reg No: ${p.registrationNumber || 'N/A'}\n`;
        message += `   Phone: ${p.phone || 'N/A'}\n\n`;
      } else if (link.linkType === "STAFF" && link.user?.profile) {
        const p = link.user.profile;
        const roles = link.user.role?.map(r => r.role.name).join(', ') || 'Staff';
        message += `👨‍🏫 <b>Staff:</b> ${p.fullName}\n`;
        message += `   Role: ${roles}\n`;
        message += `   Employee No: ${p.employeeNumber || 'N/A'}\n`;
        message += `   Phone: ${p.phone || 'N/A'}\n\n`;
      } else if (link.linkType === "GUARDIAN" && link.guardian) {
        const g = link.guardian;
        const studentNames = g.students?.map(s => s.student.fullName).join(', ') || 'N/A';
        message += `👨‍👩‍👧 <b>Guardian:</b> ${g.fullName}\n`;
        message += `   Relationship: ${g.relationship}\n`;
        message += `   Children: ${studentNames}\n`;
        message += `   Phone: ${g.phone || 'N/A'}\n\n`;
      }
    }
    
    message += `Type /menu for available commands.`;
    await telegramService.sendMessage(chatId, message);
    return;
  }

  // Fallback to legacy
  const profile = await prisma.userProfile.findFirst({
    where: { telegramChatId: chatId },
    include: { user: { include: { role: { include: { role: true } } } } },
  });

  if (!profile?.user) {
    await telegramService.sendMessage(chatId, '❌ Account not linked. Use /link YOUR_CODE to connect.');
    return;
  }

  const roles = profile.user.role?.map(r => r.role.name).join(', ') || 'User';
  let message = `👤 <b>Your Profile</b>\n\n`;
  message += `📛 Name: ${profile.fullName}\n`;
  message += `👤 Username: ${profile.user.username}\n`;
  message += `🔑 Role: ${roles}\n`;
  message += `\n/help - All commands`;
  
  await telegramService.sendMessage(chatId, message);
}

  /**
   * /timetable command - For both students and teachers
   */
  private async handleTimetableCommand(chatId: string, profile: any, roles: string[]) {
    if (!profile) {
      await telegramService.sendMessage(chatId, '❌ Account not linked.');
      return;
    }

    const isTeacher = roles.includes('TEACHER') || roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
    const isStudent = roles.includes('STUDENT');

    if (isTeacher) {
      // Get teacher's timetable
      const assignments = await prisma.teacherAssignment.findMany({
        where: { teacherId: profile.id },
        include: {
          subject: { select: { name: true, code: true } },
          classroom: { select: { name: true } },
          academicTerm: {
            select: { name: true, isCurrent: true },
          },
          timetableEntries: {
            include: {
              schedulePeriod: { select: { name: true, startTime: true, endTime: true } },
            },
            orderBy: { dayOfWeek: 'asc' },
          },
        },
      });

      if (assignments.length === 0) {
        await telegramService.sendMessage(chatId, '📅 No teaching assignments found.');
        return;
      }

      let message = `📅 <b>Your Teaching Schedule</b>\n\n`;
      const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

      assignments.forEach(a => {
        message += `📘 ${a.subject.name} (${a.classroom.name})\n`;
        message += `   Term: ${a.academicTerm.name}\n`;

        days.forEach(day => {
          const entries = a.timetableEntries.filter(e => e.dayOfWeek === day);
          if (entries.length > 0) {
            message += `   ${day}: `;
            entries.forEach(e => {
              message += `${e.schedulePeriod.name}(${e.schedulePeriod.startTime}-${e.schedulePeriod.endTime}) `;
            });
            message += '\n';
          }
        });
        message += '\n';
      });

      await telegramService.sendMessage(chatId, message);
    } else if (isStudent) {
      // Get student's timetable
      const enrollment = await prisma.studentEnrollment.findFirst({
        where: { studentId: profile.id, isActive: true },
        include: {
          classroom: { select: { id: true, name: true } },
          academicTerm: { select: { name: true } },
        },
      });

      if (!enrollment) {
        await telegramService.sendMessage(chatId, '📅 No active enrollment found.');
        return;
      }

      const entries = await prisma.timetableEntry.findMany({
        where: {
          classroomId: enrollment.classroomId,
          isActive: true,
        },
        include: {
          schedulePeriod: { select: { name: true, startTime: true, endTime: true } },
          teacherAssignment: {
            include: {
              subject: { select: { name: true } },
              teacher: { select: { fullName: true } },
            },
          },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { schedulePeriod: { order: 'asc' } }],
      });

      if (entries.length === 0) {
        await telegramService.sendMessage(chatId, '📅 No timetable entries found.');
        return;
      }

      let message = `📅 <b>Your Timetable</b>\n`;
      message += `Class: ${enrollment.classroom.name}\n\n`;

      const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
      days.forEach(day => {
        const dayEntries = entries.filter(e => e.dayOfWeek === day);
        if (dayEntries.length > 0) {
          message += `<b>${day}</b>\n`;
          dayEntries.forEach(e => {
            message += `  ${e.schedulePeriod.name}: ${e.teacherAssignment.subject.name} (${e.teacherAssignment.teacher.fullName})\n`;
          });
          message += '\n';
        }
      });

      await telegramService.sendMessage(chatId, message);
    }
  }

  /**
   * /grades command - Student grades
   */
  private async handleStudentGrades(chatId: string, profile: any) {
    if (!profile) {
      await telegramService.sendMessage(chatId, '❌ Account not linked.');
      return;
    }

    const enrollment = await prisma.studentEnrollment.findFirst({
      where: { studentId: profile.id, isActive: true },
      include: {
        academicTerm: { include: { academicYear: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!enrollment) {
      await telegramService.sendMessage(chatId, '📚 No active enrollment found.');
      return;
    }

    const results = await prisma.assessmentResult.findMany({
      where: {
        enrollmentId: enrollment.id,
        assessment: { isPublished: true },
      },
      include: {
        assessment: {
          include: {
            teacherAssignment: { include: { subject: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    let message = `📊 <b>Your Recent Grades</b>\n`;
    message += `Term: ${enrollment.academicTerm.name}\n\n`;

    if (results.length === 0) {
      message += 'No grades published yet.';
    } else {
      results.forEach(r => {
        const subject = r.assessment.teacherAssignment.subject.name;
        const percentage = r.percentage ? Number(r.percentage).toFixed(1) : 'N/A';
        const emoji = Number(percentage) >= 80 ? '🟢' : Number(percentage) >= 50 ? '🟡' : '🔴';
        message += `${emoji} ${r.assessment.title} (${subject})\n`;
        message += `   Score: ${percentage}%\n\n`;
      });
    }

    message += `\nLogin to portal for full results.`;
    await telegramService.sendMessage(chatId, message);
  }

  /**
   * /attendance command - For students and teachers
   */
  private async handleAttendanceCommand(chatId: string, profile: any, roles: string[]) {
    if (!profile) {
      await telegramService.sendMessage(chatId, '❌ Account not linked.');
      return;
    }

    if (roles.includes('STUDENT') && !roles.includes('TEACHER')) {
      // Student attendance
      const enrollment = await prisma.studentEnrollment.findFirst({
        where: { studentId: profile.id, isActive: true },
      });

      if (!enrollment) {
        await telegramService.sendMessage(chatId, '📚 No active enrollment found.');
        return;
      }

      const records = await prisma.studentAttendanceRecord.findMany({
        where: { enrollmentId: enrollment.id },
        include: {
          attendanceSession: { select: { sessionDate: true } },
        },
        orderBy: { attendanceSession: { sessionDate: 'desc' } },
        take: 30,
      });

      const present = records.filter(r => r.status === 'PRESENT').length;
      const absent = records.filter(r => r.status === 'ABSENT').length;
      const late = records.filter(r => r.status === 'LATE').length;
      const total = records.length;

      let message = `📋 <b>Your Attendance</b>\n\n`;
      message += `📊 Summary (last ${total} days):\n`;
      message += `✅ Present: ${present}\n`;
      message += `❌ Absent: ${absent}\n`;
      message += `⏰ Late: ${late}\n`;
      message += `📈 Attendance: ${total > 0 ? Math.round((present / total) * 100) : 0}%\n`;

      await telegramService.sendMessage(chatId, message);
    } else if (roles.includes('TEACHER')) {
      // Staff attendance
      const records = await prisma.staffAttendanceRecord.findMany({
        where: { profileId: profile.id },
        orderBy: { attendanceDate: 'desc' },
        take: 30,
      });

      const present = records.filter(r => r.status === 'PRESENT').length;
      const absent = records.filter(r => r.status === 'ABSENT').length;
      const late = records.filter(r => r.status === 'LATE').length;
      const total = records.length;

      let message = `📋 <b>Your Attendance</b>\n\n`;
      message += `📊 Summary (last ${total} days):\n`;
      message += `✅ Present: ${present}\n`;
      message += `❌ Absent: ${absent}\n`;
      message += `⏰ Late: ${late}\n`;
      message += `📈 Attendance: ${total > 0 ? Math.round(((present + late) / total) * 100) : 0}%\n`;

      await telegramService.sendMessage(chatId, message);
    }
  }

  /**
   * /fees command - Fee status
   */
  private async handleFeesCommand(chatId: string, profile: any) {
    if (!profile) {
      await telegramService.sendMessage(chatId, '❌ Account not linked.');
      return;
    }

    const enrollment = await prisma.studentEnrollment.findFirst({
      where: { studentId: profile.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!enrollment) {
      await telegramService.sendMessage(chatId, '📚 No active enrollment found.');
      return;
    }

    const invoices = await prisma.studentInvoice.findMany({
      where: {
        enrollmentId: enrollment.id,
        status: { in: ['PENDING', 'PARTIALLY_PAID'] },
      },
      include: {
        feeStructure: { include: { feeCategory: true } },
        payments: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    let message = `💰 <b>Your Fee Status</b>\n\n`;

    if (invoices.length === 0) {
      message += '✅ No pending fees! All paid up.';
    } else {
      let totalOwed = 0;
      invoices.forEach(inv => {
        const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const balance = Number(inv.totalAmount || inv.amount) - paid;
        totalOwed += balance;
        message += `📋 ${inv.feeStructure.feeCategory.name}\n`;
        message += `   Amount: ${Number(inv.amount)} ETB\n`;
        if (paid > 0) message += `   Paid: ${paid} ETB\n`;
        if (balance > 0) message += `   ⚠️ Balance: ${balance} ETB\n`;
        if (inv.dueDate) message += `   Due: ${new Date(inv.dueDate).toLocaleDateString()}\n`;
        message += '\n';
      });
      message += `\n<b>Total Owed: ${totalOwed} ETB</b>`;
    }

    message += `\n\nPay at the school office.`;
    await telegramService.sendMessage(chatId, message);
  }

  /**
   * /myclass command - Teacher's homeroom class
   */
  private async handleMyClassCommand(chatId: string, profile: any) {
    if (!profile) {
      await telegramService.sendMessage(chatId, '❌ Account not linked.');
      return;
    }

    const homeroom = await prisma.homeroomTeacher.findFirst({
      where: { teacherId: profile.id, isActive: true },
      include: {
        classroom: { select: { id: true, name: true } },
        academicTerm: { select: { name: true } },
      },
    });

    if (!homeroom) {
      await telegramService.sendMessage(chatId, '📚 You are not assigned as a homeroom teacher.');
      return;
    }

    const students = await prisma.studentEnrollment.findMany({
      where: { classroomId: homeroom.classroomId, isActive: true },
      include: { student: { select: { fullName: true, registrationNumber: true } } },
      orderBy: { student: { fullName: 'asc' } },
    });

    let message = `🏫 <b>Your Homeroom Class</b>\n\n`;
    message += `Class: ${homeroom.classroom.name}\n`;
    message += `Term: ${homeroom.academicTerm.name}\n`;
    message += `Students: ${students.length}\n\n`;
    message += `<b>Student List:</b>\n`;
    students.forEach((s, i) => {
      message += `${i + 1}. ${s.student.fullName} (${s.student.registrationNumber})\n`;
    });

    await telegramService.sendMessage(chatId, message);
  }

  /**
   * /salary command - Staff salary
   */
  private async handleSalaryCommand(chatId: string, profile: any) {
    if (!profile) {
      await telegramService.sendMessage(chatId, '❌ Account not linked.');
      return;
    }

    const payments = await prisma.salaryPayment.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    if (payments.length === 0) {
      await telegramService.sendMessage(chatId, '💰 No salary records found.');
      return;
    }

    let message = `💰 <b>Your Salary</b>\n\n`;
    payments.forEach(p => {
      const statusEmoji = p.status === 'PAID' ? '✅' : p.status === 'PENDING' ? '⏳' : '❌';
      message += `${statusEmoji} ${p.paymentPeriod}\n`;
      message += `   Net: ${Number(p.netSalary).toLocaleString()} ETB\n`;
      message += `   Status: ${p.status}\n`;
      if (p.paymentDate) message += `   Paid: ${new Date(p.paymentDate).toLocaleDateString()}\n`;
      message += '\n';
    });

    await telegramService.sendMessage(chatId, message);
  }

  /**
   * /assignments command
   */
  private async handleAssignmentsCommand(chatId: string, profile: any, roles: string[]) {
    if (!profile) {
      await telegramService.sendMessage(chatId, '❌ Account not linked.');
      return;
    }

    if (roles.includes('TEACHER')) {
      // Teacher's assignments
      const assignments = await prisma.teacherAssignment.findMany({
        where: { teacherId: profile.id },
        include: {
          subject: { select: { name: true, code: true } },
          classroom: { select: { name: true } },
          academicTerm: { select: { name: true, isCurrent: true } },
        },
        where: { teacherId: profile.id, academicTerm: { isCurrent: true } },
      });

      if (assignments.length === 0) {
        await telegramService.sendMessage(chatId, '📚 No teaching assignments for current term.');
        return;
      }

      let message = `📚 <b>Your Teaching Assignments</b>\n\n`;
      assignments.forEach(a => {
        message += `📘 ${a.subject.name} (${a.subject.code})\n`;
        message += `   Class: ${a.classroom.name}\n`;
        message += `   Periods/week: ${a.weeklyPeriods || 'N/A'}\n\n`;
      });

      await telegramService.sendMessage(chatId, message);
    } else if (roles.includes('STUDENT')) {
      // Student's subjects
      const enrollment = await prisma.studentEnrollment.findFirst({
        where: { studentId: profile.id, isActive: true },
        include: { classroom: { select: { id: true } } },
      });

      if (!enrollment) {
        await telegramService.sendMessage(chatId, '📚 No active enrollment found.');
        return;
      }

      const subjects = await prisma.teacherAssignment.findMany({
        where: { classroomId: enrollment.classroomId },
        include: {
          subject: { select: { name: true, code: true } },
          teacher: { select: { fullName: true } },
        },
      });

      let message = `📚 <b>Your Subjects</b>\n\n`;
      const uniqueSubjects = [...new Map(subjects.map(s => [s.subjectId, s])).values()];
      uniqueSubjects.forEach(s => {
        message += `📘 ${s.subject.name} (${s.subject.code})\n`;
        message += `   Teacher: ${s.teacher.fullName}\n\n`;
      });

      await telegramService.sendMessage(chatId, message);
    }
  }

  /**
   * /reportcard command
   */
  private async handleReportCardCommand(chatId: string, profile: any, roles: string[]) {
    if (!profile) {
      await telegramService.sendMessage(chatId, '❌ Account not linked.');
      return;
    }

    if (!roles.includes('STUDENT')) {
      await telegramService.sendMessage(chatId, '❌ This command is for students only.');
      return;
    }

    await telegramService.sendMessage(chatId,
      '📊 Report cards are available on the student portal.\n\n' +
      'Login to your account to view your full report card with all subjects and grades.'
    );
  }

  /**
   * /overview command - Admin overview
   */
  private async handleOverviewCommand(chatId: string) {
    const studentCount = await prisma.studentEnrollment.count({ where: { isActive: true } });
    const teacherCount = await prisma.teacherAssignment.groupBy({ by: ['teacherId'] });
    const pendingFees = await prisma.studentInvoice.aggregate({
      where: { status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
      _sum: { totalAmount: true },
      _count: true,
    });

    let message = `📊 <b>System Overview</b>\n\n`;
    message += `👨‍🎓 Active Students: ${studentCount}\n`;
    message += `👨‍🏫 Active Teachers: ${teacherCount.length}\n`;
    message += `💰 Pending Fees: ${Number(pendingFees._sum.totalAmount || 0).toLocaleString()} ETB\n`;
    message += `📋 Pending Invoices: ${pendingFees._count}\n`;

    await telegramService.sendMessage(chatId, message);
  }

  /**
   * /help command - Dynamic based on user role
   */
  private async handleHelpCommand(chatId: string, roles: string[]) {
    let message = `🤖 <b>Imam Hassen SMS Bot</b>\n\n`;

    if (roles.length === 0) {
      message += `<b>Getting Started:</b>\n`;
      message += `/start - Start the bot\n`;
      message += `/link CODE - Link your account\n`;
      message += `/help - Show this help\n`;
    } else {
      message += `<b>General:</b>\n`;
      message += `/status - Your profile\n`;
      message += `/help - All commands\n`;

      if (roles.includes('STUDENT') && !roles.includes('TEACHER') && !roles.includes('ADMIN')) {
        message += `\n<b>Student Commands:</b>\n`;
        message += `/timetable - Class schedule\n`;
        message += `/grades - Recent grades\n`;
        message += `/fees - Fee status\n`;
        message += `/attendance - Attendance\n`;
        message += `/assignments - Your subjects\n`;
        message += `/reportcard - Report card info\n`;
      }

      if (roles.includes('TEACHER') || roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) {
        message += `\n<b>Teacher/Staff Commands:</b>\n`;
        message += `/timetable - Teaching schedule\n`;
        message += `/myclass - Homeroom class\n`;
        message += `/attendance - Your attendance\n`;
        message += `/salary - Salary info\n`;
        message += `/assignments - Teaching load\n`;
      }

      if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) {
        message += `\n<b>Admin Commands:</b>\n`;
        message += `/overview - System overview\n`;
      }
    }

    message += `\n<b>How to link:</b>\n`;
    message += `Portal > Settings > Telegram > Copy code > /link CODE\n\n`;
    message += `Need help? Contact administration.`;

    await telegramService.sendMessage(chatId, message);
  }

  // Add this method for child attendance:
private async handleChildAttendanceCommand(chatId: string) {
  const guardianLinks = await prisma.telegramLink.findMany({
    where: { chatId, linkType: "GUARDIAN", isActive: true },
    include: {
      guardian: {
        include: {
          students: { include: { student: true } },
        },
      },
    },
  });

  if (guardianLinks.length === 0) {
    await telegramService.sendMessage(chatId, '❌ No children linked.');
    return;
  }

  let message = `📋 <b>Children's Attendance</b>\n\n`;

  for (const link of guardianLinks) {
    for (const sg of link.guardian!.students) {
      const enrollment = await prisma.studentEnrollment.findFirst({
        where: { studentId: sg.studentId, isActive: true },
      });

      if (!enrollment) continue;

      const records = await prisma.studentAttendanceRecord.findMany({
        where: { enrollmentId: enrollment.id },
        select: { status: true },
        take: 30,
      });

      const present = records.filter(r => r.status === 'PRESENT').length;
      const total = records.length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      message += `📚 ${sg.student.fullName}: ${rate}% attendance\n`;
    }
    message += '\n';
  }

  await telegramService.sendMessage(chatId, message);
}
// src/modules/notification/gateway/telegram/telegram-bot.service.ts

/**
 * /children command - Guardian views their children
 */
private async handleChildrenCommand(chatId: string) {
  const guardianLinks = await this.getLinkedProfilesNew(chatId);
  const guardianLinks_filtered = guardianLinks.filter(l => l.linkType === "GUARDIAN" && l.guardian);

  if (guardianLinks_filtered.length === 0) {
    // Check legacy
    const legacyGuardian = await prisma.guardian.findFirst({
      where: { telegramChatId: chatId },
      include: {
        students: {
          include: {
            student: {
              select: { id: true, fullName: true, registrationNumber: true, phone: true },
            },
          },
        },
      },
    });

    if (!legacyGuardian) {
      await telegramService.sendMessage(chatId, '❌ No children linked. Use /link GUA-CODE to link as guardian.');
      return;
    }

    let message = `👨‍👩‍👧 <b>Your Children</b>\n\n`;
    message += `<b>${legacyGuardian.fullName}</b> (${legacyGuardian.relationship})\n\n`;

    for (const sg of legacyGuardian.students) {
      message += `📚 <b>${sg.student.fullName}</b>\n`;
      message += `   Reg No: ${sg.student.registrationNumber || 'N/A'}\n`;
      message += `   Phone: ${sg.student.phone || 'N/A'}\n`;
      message += `   Relationship: ${legacyGuardian.relationship}\n\n`;
    }

    message += `Use:\n`;
    message += `/child_grades - View grades\n`;
    message += `/child_fees - Check fee status\n`;
    message += `/child_attendance - View attendance`;

    await telegramService.sendMessage(chatId, message);
    return;
  }

  let message = `👨‍👩‍👧 <b>Your Children</b>\n\n`;

  for (const link of guardianLinks_filtered) {
    const guardian = link.guardian!;
    message += `<b>${guardian.fullName}</b> (${guardian.relationship})\n\n`;

    for (const sg of guardian.students) {
      message += `📚 <b>${sg.student.fullName}</b>\n`;
      message += `   Reg No: ${sg.student.registrationNumber || 'N/A'}\n`;
      message += `\n`;
    }
  }

  message += `Use:\n`;
  message += `/child_grades - View grades\n`;
  message += `/child_fees - Check fee status\n`;
  message += `/child_attendance - View attendance`;

  await telegramService.sendMessage(chatId, message);
}

/**
 * /child_grades command - Guardian views children's recent grades
 */
private async handleChildGradesCommand(chatId: string) {
  const guardianLinks = await this.getLinkedProfilesNew(chatId);
  const guardianLinks_filtered = guardianLinks.filter(l => l.linkType === "GUARDIAN" && l.guardian);

  if (guardianLinks_filtered.length === 0) {
    // Check legacy
    const legacyGuardian = await prisma.guardian.findFirst({
      where: { telegramChatId: chatId },
      include: {
        students: {
          include: { student: { select: { id: true, fullName: true } } },
        },
      },
    });

    if (!legacyGuardian) {
      await telegramService.sendMessage(chatId, '❌ No children linked.');
      return;
    }

    await this.sendChildrenGrades(chatId, legacyGuardian.students.map(s => s.studentId));
    return;
  }

  // Collect all student IDs from all guardian links
  const studentIds: string[] = [];
  for (const link of guardianLinks_filtered) {
    for (const sg of link.guardian!.students) {
      studentIds.push(sg.studentId);
    }
  }

  await this.sendChildrenGrades(chatId, studentIds);
}

/**
 * Helper to send children's grades
 */
private async sendChildrenGrades(chatId: string, studentIds: string[]) {
  let message = `📊 <b>Children's Recent Grades</b>\n\n`;
  let hasGrades = false;

  for (const studentId of studentIds) {
    const student = await prisma.userProfile.findUnique({
      where: { id: studentId },
      select: { fullName: true, registrationNumber: true },
    });

    if (!student) continue;

    const enrollment = await prisma.studentEnrollment.findFirst({
      where: { studentId, isActive: true },
      include: {
        academicTerm: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!enrollment) {
      message += `📚 <b>${student.fullName}</b>\n`;
      message += `   No active enrollment found.\n\n`;
      continue;
    }

    const results = await prisma.assessmentResult.findMany({
      where: {
        enrollmentId: enrollment.id,
        assessment: { isPublished: true },
      },
      include: {
        assessment: {
          include: {
            teacherAssignment: { include: { subject: { select: { name: true, code: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    message += `📚 <b>${student.fullName}</b>\n`;
    message += `   Term: ${enrollment.academicTerm.name}\n`;

    if (results.length === 0) {
      message += `   No grades published yet.\n`;
    } else {
      // Group by subject and show latest
      const subjectMap = new Map<string, any>();
      results.forEach(r => {
        const subjId = r.assessment.teacherAssignment.subjectId;
        if (!subjectMap.has(subjId)) {
          subjectMap.set(subjId, r);
        }
      });

      subjectMap.forEach(r => {
        const subject = r.assessment.teacherAssignment.subject;
        const percentage = r.percentage ? Number(r.percentage).toFixed(1) : 'N/A';
        const emoji = Number(percentage) >= 80 ? '🟢' : Number(percentage) >= 50 ? '🟡' : '🔴';
        message += `   ${emoji} ${subject.name}: ${percentage}%\n`;
      });
      hasGrades = true;
    }
    message += '\n';
  }

  if (!hasGrades) {
    message += 'No grades published yet for any child.\n';
  }

  message += 'Login to the portal for full results.';
  await telegramService.sendMessage(chatId, message);
}

/**
 * /child_fees command - Guardian views children's fee status
 */
private async handleChildFeesCommand(chatId: string) {
  const guardianLinks = await this.getLinkedProfilesNew(chatId);
  const guardianLinks_filtered = guardianLinks.filter(l => l.linkType === "GUARDIAN" && l.guardian);

  if (guardianLinks_filtered.length === 0) {
    // Check legacy
    const legacyGuardian = await prisma.guardian.findFirst({
      where: { telegramChatId: chatId },
      include: {
        students: {
          include: { student: { select: { id: true, fullName: true } } },
        },
      },
    });

    if (!legacyGuardian) {
      await telegramService.sendMessage(chatId, '❌ No children linked.');
      return;
    }

    await this.sendChildrenFees(chatId, legacyGuardian.students.map(s => s.studentId));
    return;
  }

  const studentIds: string[] = [];
  for (const link of guardianLinks_filtered) {
    for (const sg of link.guardian!.students) {
      studentIds.push(sg.studentId);
    }
  }

  await this.sendChildrenFees(chatId, studentIds);
}

/**
 * Helper to send children's fee status
 */
private async sendChildrenFees(chatId: string, studentIds: string[]) {
  let message = `💰 <b>Children's Fee Status</b>\n\n`;
  let totalFamilyOwed = 0;
  let hasInvoices = false;

  for (const studentId of studentIds) {
    const student = await prisma.userProfile.findUnique({
      where: { id: studentId },
      select: { fullName: true },
    });

    if (!student) continue;

    const enrollment = await prisma.studentEnrollment.findFirst({
      where: { studentId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!enrollment) {
      message += `📚 <b>${student.fullName}</b>\n`;
      message += `   No active enrollment.\n\n`;
      continue;
    }

    const invoices = await prisma.studentInvoice.findMany({
      where: {
        enrollmentId: enrollment.id,
        status: { in: ['PENDING', 'PARTIALLY_PAID'] },
      },
      include: {
        feeStructure: { include: { feeCategory: true } },
        payments: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    message += `📚 <b>${student.fullName}</b>\n`;

    if (invoices.length === 0) {
      message += `   ✅ All fees paid\n`;
    } else {
      let studentOwed = 0;
      invoices.forEach(inv => {
        const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const balance = Number(inv.totalAmount || inv.amount) - paid;
        studentOwed += balance;
        
        message += `   📋 ${inv.feeStructure.feeCategory.name}\n`;
        message += `      Amount: ${Number(inv.amount)} ETB\n`;
        if (paid > 0) message += `      Paid: ${paid} ETB\n`;
        if (balance > 0) message += `      ⚠️ Balance: ${balance} ETB\n`;
        if (inv.dueDate) {
          const dueDate = new Date(inv.dueDate);
          const isOverdue = dueDate < new Date();
          message += `      Due: ${dueDate.toLocaleDateString()} ${isOverdue ? '🔴 OVERDUE' : ''}\n`;
        }
      });
      
      if (studentOwed > 0) {
        message += `   <b>Total Owed: ${studentOwed} ETB</b>\n`;
      }
      totalFamilyOwed += studentOwed;
      hasInvoices = true;
    }
    message += '\n';
  }

  if (!hasInvoices) {
    message += '✅ All fees are paid for all children!\n';
  } else if (totalFamilyOwed > 0) {
    message += `\n<b>Total Family Balance: ${totalFamilyOwed} ETB</b>\n`;
    message += '\n📌 Please pay at the school office or through bank transfer.\n';
    message += 'Contact the administration for payment arrangements.';
  }

  await telegramService.sendMessage(chatId, message);
}

/**
 * /child_attendance command - Guardian views children's attendance
 */
private async handleChildAttendanceCommand(chatId: string) {
  const guardianLinks = await this.getLinkedProfilesNew(chatId);
  const guardianLinks_filtered = guardianLinks.filter(l => l.linkType === "GUARDIAN" && l.guardian);

  if (guardianLinks_filtered.length === 0) {
    // Check legacy
    const legacyGuardian = await prisma.guardian.findFirst({
      where: { telegramChatId: chatId },
      include: {
        students: {
          include: { student: { select: { id: true, fullName: true } } },
        },
      },
    });

    if (!legacyGuardian) {
      await telegramService.sendMessage(chatId, '❌ No children linked.');
      return;
    }

    await this.sendChildrenAttendance(chatId, legacyGuardian.students.map(s => s.studentId));
    return;
  }

  const studentIds: string[] = [];
  for (const link of guardianLinks_filtered) {
    for (const sg of link.guardian!.students) {
      studentIds.push(sg.studentId);
    }
  }

  await this.sendChildrenAttendance(chatId, studentIds);
}

/**
 * Helper to send children's attendance
 */
private async sendChildrenAttendance(chatId: string, studentIds: string[]) {
  let message = `📋 <b>Children's Attendance</b>\n\n`;

  for (const studentId of studentIds) {
    const student = await prisma.userProfile.findUnique({
      where: { id: studentId },
      select: { fullName: true },
    });

    if (!student) continue;

    const enrollment = await prisma.studentEnrollment.findFirst({
      where: { studentId, isActive: true },
      select: { id: true },
    });

    if (!enrollment) {
      message += `📚 <b>${student.fullName}</b>: No enrollment\n\n`;
      continue;
    }

    // Get last 30 days attendance
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const records = await prisma.studentAttendanceRecord.findMany({
      where: {
        enrollmentId: enrollment.id,
        attendanceSession: { sessionDate: { gte: thirtyDaysAgo } },
      },
      select: { status: true },
    });

    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const excused = records.filter(r => r.status === 'EXCUSED').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    let emoji = '🟢';
    if (rate < 75) emoji = '🔴';
    else if (rate < 90) emoji = '🟡';

    message += `📚 <b>${student.fullName}</b>\n`;
    message += `   ${emoji} Attendance: ${rate}%\n`;
    message += `   ✅ Present: ${present} | ❌ Absent: ${absent}\n`;
    if (late > 0) message += `   ⏰ Late: ${late}\n`;
    if (excused > 0) message += `   📝 Excused: ${excused}\n`;
    message += `   📊 Total Days: ${total}\n\n`;
  }

  if (studentIds.length === 0) {
    message += 'No attendance data available.';
  }

  await telegramService.sendMessage(chatId, message);
}
}

const guardianLinkCodes = new Map<string, { guardianId: string; expiresAt: Date }>();

export const telegramBotService = new TelegramBotService();
export { guardianLinkCodes };