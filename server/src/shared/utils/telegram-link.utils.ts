// src/shared/utils/telegram-link.utils.ts
import crypto from 'crypto';
import { prisma } from '@config/prisma';

class TelegramLinkUtils {
  /**
   * Generate a temporary link code for a user
   * Code expires after 10 minutes
   */
  static async generateLinkCode(userId: string): Promise<{ code: string; expiresAt: Date }> {
    // Generate a random 8-character code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in Redis or database
    // For simplicity, we'll store in a Map (in production use Redis)
    linkCodeStore.set(code, { userId, expiresAt });

    // Clean up expired codes
    this.cleanupExpiredCodes();

    return { code, expiresAt };
  }

  /**
   * Verify and consume a link code
   */
  static async verifyLinkCode(code: string): Promise<string | null> {
    const stored = linkCodeStore.get(code);
    
    if (!stored) return null;
    
    if (new Date() > stored.expiresAt) {
      linkCodeStore.delete(code);
      return null;
    }

    // Code is valid - consume it
    linkCodeStore.delete(code);
    return stored.userId;
  }

  /**
   * Link a Telegram chat ID to a user profile
   */
  static async linkTelegramAccount(chatId: string, userId: string): Promise<string> {
    // Update the user profile with the telegram chat ID
    const profile = await prisma.userProfile.update({
      where: { userId },
      data: { telegramChatId: chatId },
      select: { fullName: true, employeeNumber: true, registrationNumber: true },
    });

    return profile.fullName;
  }

  /**
   * Clean up expired codes
   */
  private static cleanupExpiredCodes() {
    const now = new Date();
    for (const [code, data] of linkCodeStore.entries()) {
      if (now > data.expiresAt) {
        linkCodeStore.delete(code);
      }
    }
  }
}

// In-memory store (use Redis in production)
const linkCodeStore = new Map<string, { userId: string; expiresAt: Date }>();

// Clean up expired codes every 5 minutes
setInterval(() => {
  TelegramLinkUtils['cleanupExpiredCodes']();
}, 5 * 60 * 1000);

export { TelegramLinkUtils };