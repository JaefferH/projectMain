// src/modules/announcement/announcement.mapper.ts

type AnnouncementWithRelations = {
  id: string;
  branchId: string;
  title: string;
  content: string;
  excerpt: string | null;
  type: string;
  priority: string;
  isPublished: boolean;
  publishedAt: Date | null;
  publishedBy: string | null;
  startDate: Date | null;
  endDate: Date | null;
  targetAudience: string[];
  targetRoles: string[];
  targetUserIds: string[];
  targetClassroomIds: string[];
  sendPushNotification: boolean;
  pushChannels: string[];
  pushScheduledAt: Date | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
  branch?: { id: string; name: string; code: string };
  publishedByUser?: { id: string; username: string };
  _count?: {
    deliveries: number;
    userViews: number;
  };
  userViews?: { id: string; userId: string; viewedAt: Date; readAt: Date | null }[];
};

export class AnnouncementMapper {
  static toResponse(announcement: AnnouncementWithRelations) {
    return {
      id: announcement.id,
      branchId: announcement.branchId,
      title: announcement.title,
      content: announcement.content,
      excerpt: announcement.excerpt,
      type: announcement.type,
      priority: announcement.priority,
      isPublished: announcement.isPublished,
      publishedAt: announcement.publishedAt,
      startDate: announcement.startDate,
      endDate: announcement.endDate,
      targetAudience: announcement.targetAudience,
      sendPushNotification: announcement.sendPushNotification,
      pushChannels: announcement.pushChannels,
      metadata: announcement.metadata,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
      branch: announcement.branch || undefined,
      publishedBy: announcement.publishedByUser || undefined,
      stats: {
        deliveries: announcement._count?.deliveries || 0,
        views: announcement._count?.userViews || 0,
      },
    };
  }

  static toList(announcements: AnnouncementWithRelations[]) {
    return announcements.map(a => this.toResponse(a));
  }

  static toDetail(announcement: AnnouncementWithRelations) {
    return {
      ...this.toResponse(announcement),
      deliveryStats: {
        total: announcement._count?.deliveries || 0,
        delivered: 0, // Would need to calculate from deliveries
        read: announcement.userViews?.filter(v => v.readAt).length || 0,
      },
    };
  }
}