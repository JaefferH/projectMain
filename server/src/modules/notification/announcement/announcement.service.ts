// src/modules/announcement/announcement.service.ts
import { prisma } from "@config/prisma";
import { AnnouncementMapper } from "./announcement.mapper";
import { CreateAnnouncementDto, UpdateAnnouncementDto } from "./announcement.validation";
import { AppError } from "@shared/errors/AppError";
import { telegramService } from "@shared/services/telegram.service";
import { CacheUtils } from "@shared/utils/cache.utils";

class AnnouncementService {

  private async getTelegramChatIdsForUser(userId: string): Promise<string[]> {
    const chatIds: string[] = [];
    const links = await prisma.telegramLink.findMany({ where: { userId, isActive: true }, select: { chatId: true } });
    links.forEach(l => chatIds.push(l.chatId));
    if (chatIds.length === 0) {
      const profile = await prisma.userProfile.findUnique({ where: { userId }, select: { telegramChatId: true } });
      if (profile?.telegramChatId) chatIds.push(profile.telegramChatId);
    }
    return [...new Set(chatIds)];
  }

  async getAnnouncements(params: {
    branchId?: string; type?: string; priority?: string;
    isPublished?: boolean; targetAudience?: string; page?: number; limit?: number;
  }) {
    const page = params.page ?? 1; const limit = params.limit ?? 10;
    const cacheKey = `announcements:list:${page}:${limit}:${params.branchId || 'all'}:${params.type || 'all'}:${params.isPublished ?? 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const where: any = {
        ...(params.branchId && { branchId: params.branchId }),
        ...(params.type && { type: params.type }),
        ...(params.priority && { priority: params.priority }),
        ...(params.isPublished !== undefined && { isPublished: params.isPublished }),
        ...(params.targetAudience && { targetAudience: { has: params.targetAudience } }),
      };

      const [announcements, total] = await prisma.$transaction([
        prisma.announcement.findMany({
          where, skip, take: limit,
          include: { branch: { select: { id: true, name: true, code: true } }, publishedByUser: { select: { id: true, username: true } }, _count: { select: { deliveries: true, userViews: true } } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.announcement.count({ where }),
      ]);

      return { items: AnnouncementMapper.toList(announcements), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }, 120);
  }

  async getAnnouncementById(id: string) {
    return CacheUtils.getOrSet(`announcement:${id}`, async () => {
      const announcement = await prisma.announcement.findUnique({
        where: { id },
        include: { branch: { select: { id: true, name: true, code: true } }, publishedByUser: { select: { id: true, username: true } }, userViews: true, _count: { select: { deliveries: true, userViews: true } } },
      });
      if (!announcement) throw new AppError("Announcement not found.", 404);
      return AnnouncementMapper.toDetail(announcement);
    }, 300);
  }

  async getMyAnnouncements(userId: string) {
    const cacheKey = CacheUtils.keys.announcements(userId);
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: { include: { role: true } }, profile: true } });
      if (!user) throw new AppError("User not found.", 404);

      const userRoles = user.role.map(r => r.role.name);
      const isSuperAdmin = userRoles.includes("SUPER_ADMIN");
      const isAdmin = userRoles.includes("ADMIN");

      const audienceTypes: string[] = [];
      if (isSuperAdmin || isAdmin) audienceTypes.push("ADMIN");
      if (userRoles.includes("TEACHER")) audienceTypes.push("TEACHER");
      if (userRoles.includes("STUDENT")) audienceTypes.push("STUDENT");
      audienceTypes.push("ALL");

      const now = new Date();
      const where: any = {
        isPublished: true,
        OR: [{ targetAudience: { hasSome: audienceTypes } }, { targetRoles: { hasSome: userRoles } }, { targetUserIds: { has: userId } }],
        AND: [{ OR: [{ startDate: null }, { startDate: { lte: now } }] }, { OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      };

      if (!isSuperAdmin) {
        if (user.branchId) where.branchId = user.branchId;
        else if (user.organizationId) where.branch = { organizationId: user.organizationId };
      }

      const announcements = await prisma.announcement.findMany({
        where,
        include: { branch: { select: { id: true, name: true, code: true } }, userViews: { where: { userId }, select: { id: true, userId: true, viewedAt: true, readAt: true } } },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      });

      // Record views
      for (const announcement of announcements) {
        if (!announcement.userViews.length) {
          await prisma.announcementView.upsert({ where: { announcementId_userId: { announcementId: announcement.id, userId } }, update: {}, create: { announcementId: announcement.id, userId, viewedAt: new Date() } });
        }
      }

      const unreadCount = announcements.filter(a => !a.userViews.length || !a.userViews[0].readAt).length;

      return { items: announcements.map(a => ({ ...AnnouncementMapper.toResponse(a), isViewed: a.userViews.length > 0, isRead: a.userViews.some(v => v.readAt) })), unreadCount };
    }, 60);
  }

  async markAsRead(announcementId: string, userId: string) {
    await prisma.announcementView.upsert({ where: { announcementId_userId: { announcementId, userId } }, update: { readAt: new Date() }, create: { announcementId, userId, viewedAt: new Date(), readAt: new Date() } });
    await CacheUtils.delete(CacheUtils.keys.announcements(userId));
    return { message: "Announcement marked as read." };
  }

  async markAllAsRead(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: { include: { role: true } } } });
    if (!user) throw new AppError("User not found.", 404);

    const userRoles = user.role.map(r => r.role.name);
    const isSuperAdmin = userRoles.includes("SUPER_ADMIN");
    const audienceTypes = this.getAudienceTypes(userRoles);
    const now = new Date();

    const where: any = {
      isPublished: true,
      OR: [{ targetAudience: { hasSome: audienceTypes } }, { targetRoles: { hasSome: userRoles } }, { targetUserIds: { has: userId } }],
      AND: [{ OR: [{ startDate: null }, { startDate: { lte: now } }] }, { OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    };
    if (!isSuperAdmin && user.branchId) where.branchId = user.branchId;

    const announcements = await prisma.announcement.findMany({ where, select: { id: true } });
    let count = 0;
    for (const announcement of announcements) {
      await prisma.announcementView.upsert({ where: { announcementId_userId: { announcementId: announcement.id, userId } }, update: { readAt: new Date() }, create: { announcementId: announcement.id, userId, viewedAt: new Date(), readAt: new Date() } });
      count++;
    }

    await CacheUtils.delete(CacheUtils.keys.announcements(userId));
    return { message: `${count} announcements marked as read.` };
  }

  private getAudienceTypes(userRoles: string[]): string[] {
    const types: string[] = [];
    if (userRoles.includes("SUPER_ADMIN") || userRoles.includes("ADMIN")) types.push("ADMIN");
    if (userRoles.includes("TEACHER")) types.push("TEACHER");
    if (userRoles.includes("STUDENT")) types.push("STUDENT");
    types.push("ALL");
    return types;
  }

  async createAnnouncement(data: CreateAnnouncementDto, userId: string) {
    const now = new Date();
    const startDate = data.startDate ? new Date(data.startDate) : null;
    const shouldPublishNow = !startDate || startDate <= now;

    const announcement = await prisma.announcement.create({
      data: {
        branchId: data.branchId, title: data.title, content: data.content,
        excerpt: data.excerpt || data.content.substring(0, 150), type: data.type as any, priority: data.priority as any,
        isPublished: shouldPublishNow, publishedAt: shouldPublishNow ? now : null, publishedBy: userId,
        startDate, endDate: data.endDate ? new Date(data.endDate) : null,
        targetAudience: data.targetAudience, targetRoles: data.targetRoles || [], targetUserIds: data.targetUserIds || [], targetClassroomIds: data.targetClassroomIds || [],
        sendPushNotification: data.sendPushNotification, pushChannels: data.pushChannels as any, pushScheduledAt: data.pushScheduledAt ? new Date(data.pushScheduledAt) : null,
        metadata: data.metadata,
        eventDate: data.eventDate ? new Date(data.eventDate) : null, eventStartTime: data.eventStartTime, eventEndTime: data.eventEndTime, eventLocation: data.eventLocation, isAllDay: data.isAllDay ?? false, color: data.color,
      },
      include: { branch: { select: { id: true, name: true, code: true } }, publishedByUser: { select: { id: true, username: true } }, _count: { select: { deliveries: true, userViews: true } } },
    });

    await prisma.announcementLog.create({ data: { announcementId: announcement.id, action: "CREATED", details: { published: shouldPublishNow, pushEnabled: data.sendPushNotification, channels: data.pushChannels }, performedBy: userId } });

    if (shouldPublishNow && data.sendPushNotification) await this.sendPushNotifications(announcement.id, userId);

    // Invalidate caches
    await CacheUtils.invalidatePattern('announcements:*');
    await CacheUtils.invalidatePattern('dashboard:*');
    await CacheUtils.invalidatePattern('calendar:*');

    return AnnouncementMapper.toResponse(announcement);
  }

  private async sendPushNotifications(announcementId: string, senderId: string) {
    const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } });
    if (!announcement) return;

    let userIds: string[] = [];
    if (announcement.targetUserIds?.length) {
      userIds = announcement.targetUserIds;
    } else {
      let roleNames: string[] = [];
      if (announcement.targetRoles?.length) {
        roleNames = announcement.targetRoles;
      } else if (announcement.targetAudience.includes("ALL")) {
        const allUsers = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
        userIds = allUsers.map(u => u.id);
      } else {
        const audienceRoleMap: Record<string, string[]> = { "ADMIN": ["ADMIN", "SUPER_ADMIN"], "TEACHER": ["TEACHER"], "STUDENT": ["STUDENT"] };
        roleNames = announcement.targetAudience.flatMap(a => audienceRoleMap[a] || []);
      }
      if (roleNames.length > 0) {
        const users = await prisma.user.findMany({ where: { isActive: true, role: { some: { role: { name: { in: roleNames } } } } }, select: { id: true } });
        userIds = users.map(u => u.id);
      }
    }
    if (!userIds.length) return;

    const channels = announcement.pushChannels || ["IN_APP"];
    const message = announcement.excerpt || announcement.content.substring(0, 300);
    const priorityEmoji: Record<string, string> = { LOW: "ℹ️", NORMAL: "📢", HIGH: "⚠️", URGENT: "🚨" };
    const emoji = priorityEmoji[announcement.priority] || "📢";

    let telegramSent = 0; let telegramFailed = 0;
    for (const channel of channels) {
      if (channel === "TELEGRAM") {
        for (const userId of userIds) {
          const chatIds = await this.getTelegramChatIdsForUser(userId);
          for (const chatId of chatIds) {
            try {
              await telegramService.sendMessage(chatId, `${emoji} <b>${announcement.title}</b>\n\n${message}`);
              telegramSent++;
              await prisma.announcementDelivery.upsert({ where: { announcementId_userId_channel: { announcementId, userId, channel: "TELEGRAM" } }, update: { status: "DELIVERED", sentAt: new Date(), deliveredAt: new Date() }, create: { announcementId, userId, channel: "TELEGRAM", status: "DELIVERED", sentAt: new Date(), deliveredAt: new Date() } });
            } catch (error: any) {
              telegramFailed++;
              await prisma.announcementDelivery.upsert({ where: { announcementId_userId_channel: { announcementId, userId, channel: "TELEGRAM" } }, update: { status: "FAILED", errorMessage: error.message }, create: { announcementId, userId, channel: "TELEGRAM", status: "FAILED", errorMessage: error.message } });
            }
          }
        }
      }
    }

    await prisma.announcementLog.create({ data: { announcementId, action: "DELIVERY_COMPLETED", details: { totalRecipients: userIds.length, telegramSent, telegramFailed, channels }, performedBy: senderId } });
  }

  async updateAnnouncement(id: string, data: UpdateAnnouncementDto) {
    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) throw new AppError("Announcement not found.", 404);

    const updated = await prisma.announcement.update({
      where: { id },
      data: { ...(data.title && { title: data.title }), ...(data.content && { content: data.content }), ...(data.excerpt !== undefined && { excerpt: data.excerpt }), ...(data.type && { type: data.type as any }), ...(data.priority && { priority: data.priority as any }), ...(data.isPublished !== undefined && { isPublished: data.isPublished }), ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }), ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }), ...(data.targetAudience && { targetAudience: data.targetAudience }) },
      include: { branch: { select: { id: true, name: true, code: true } }, publishedByUser: { select: { id: true, username: true } }, _count: { select: { deliveries: true, userViews: true } } },
    });

    await Promise.all([CacheUtils.delete(`announcement:${id}`), CacheUtils.invalidatePattern('announcements:list:*'), CacheUtils.invalidatePattern('announcements:my:*')]);
    return AnnouncementMapper.toResponse(updated);
  }

  async deleteAnnouncement(id: string) {
    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) throw new AppError("Announcement not found.", 404);
    await prisma.announcement.delete({ where: { id } });
    await Promise.all([CacheUtils.delete(`announcement:${id}`), CacheUtils.invalidatePattern('announcements:*')]);
    return { message: "Announcement deleted successfully." };
  }
}

export const announcementService = new AnnouncementService();