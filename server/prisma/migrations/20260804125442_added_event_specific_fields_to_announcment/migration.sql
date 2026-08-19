-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "color" TEXT,
ADD COLUMN     "eventDate" TIMESTAMP(3),
ADD COLUMN     "eventEndTime" TEXT,
ADD COLUMN     "eventLocation" TEXT,
ADD COLUMN     "eventStartTime" TEXT,
ADD COLUMN     "isAllDay" BOOLEAN NOT NULL DEFAULT false;
