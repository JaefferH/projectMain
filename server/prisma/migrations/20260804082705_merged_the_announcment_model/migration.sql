/*
  Warnings:

  - The `type` column on the `Announcement` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `priority` column on the `Announcement` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `AnnouncementAttachment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NotificationAttachment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NotificationDeliveryLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NotificationRecipient` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('GENERAL', 'ASSESSMENT', 'EXAM', 'FEE_DUE', 'FEE_PAID', 'ATTENDANCE', 'GRADE_POSTED', 'REPORT_CARD', 'EVENT', 'HOLIDAY', 'MEETING', 'EMERGENCY', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "DeliveryChannel" AS ENUM ('IN_APP', 'TELEGRAM', 'SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- DropForeignKey
ALTER TABLE "AnnouncementAttachment" DROP CONSTRAINT "AnnouncementAttachment_announcementId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_branchId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_senderId_fkey";

-- DropForeignKey
ALTER TABLE "NotificationAttachment" DROP CONSTRAINT "NotificationAttachment_notificationId_fkey";

-- DropForeignKey
ALTER TABLE "NotificationDeliveryLog" DROP CONSTRAINT "NotificationDeliveryLog_notificationId_fkey";

-- DropForeignKey
ALTER TABLE "NotificationRecipient" DROP CONSTRAINT "NotificationRecipient_notificationId_fkey";

-- DropForeignKey
ALTER TABLE "NotificationRecipient" DROP CONSTRAINT "NotificationRecipient_profileId_fkey";

-- DropForeignKey
ALTER TABLE "NotificationRecipient" DROP CONSTRAINT "NotificationRecipient_userId_fkey";

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "excerpt" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "pushChannels" "DeliveryChannel"[],
ADD COLUMN     "pushScheduledAt" TIMESTAMP(3),
ADD COLUMN     "sendPushNotification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "targetClassroomIds" TEXT[],
ADD COLUMN     "targetRoles" TEXT[],
ADD COLUMN     "targetUserIds" TEXT[],
DROP COLUMN "type",
ADD COLUMN     "type" "AnnouncementType" NOT NULL DEFAULT 'GENERAL',
DROP COLUMN "priority",
ADD COLUMN     "priority" "AnnouncementPriority" NOT NULL DEFAULT 'NORMAL';

-- DropTable
DROP TABLE "AnnouncementAttachment";

-- DropTable
DROP TABLE "Notification";

-- DropTable
DROP TABLE "NotificationAttachment";

-- DropTable
DROP TABLE "NotificationDeliveryLog";

-- DropTable
DROP TABLE "NotificationRecipient";

-- DropEnum
DROP TYPE "NotificationChannel";

-- DropEnum
DROP TYPE "NotificationPriority";

-- DropEnum
DROP TYPE "NotificationStatus";

-- DropEnum
DROP TYPE "NotificationType";

-- CreateTable
CREATE TABLE "AnnouncementDelivery" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "DeliveryChannel" NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnnouncementDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementView" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementLog" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnnouncementDelivery_announcementId_idx" ON "AnnouncementDelivery"("announcementId");

-- CreateIndex
CREATE INDEX "AnnouncementDelivery_userId_idx" ON "AnnouncementDelivery"("userId");

-- CreateIndex
CREATE INDEX "AnnouncementDelivery_status_idx" ON "AnnouncementDelivery"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementDelivery_announcementId_userId_channel_key" ON "AnnouncementDelivery"("announcementId", "userId", "channel");

-- CreateIndex
CREATE INDEX "AnnouncementView_announcementId_idx" ON "AnnouncementView"("announcementId");

-- CreateIndex
CREATE INDEX "AnnouncementView_userId_idx" ON "AnnouncementView"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementView_announcementId_userId_key" ON "AnnouncementView"("announcementId", "userId");

-- CreateIndex
CREATE INDEX "AnnouncementLog_announcementId_idx" ON "AnnouncementLog"("announcementId");

-- CreateIndex
CREATE INDEX "AnnouncementLog_createdAt_idx" ON "AnnouncementLog"("createdAt");

-- CreateIndex
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");

-- AddForeignKey
ALTER TABLE "AnnouncementDelivery" ADD CONSTRAINT "AnnouncementDelivery_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementDelivery" ADD CONSTRAINT "AnnouncementDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementView" ADD CONSTRAINT "AnnouncementView_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementView" ADD CONSTRAINT "AnnouncementView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementLog" ADD CONSTRAINT "AnnouncementLog_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementLog" ADD CONSTRAINT "AnnouncementLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
