// src/shared/services/telegram.service.ts
import axios from 'axios';
import { env } from '../../config/env';

class TelegramService {
  private botToken: string;
  private apiUrl: string;

  constructor() {
    this.botToken = env.telegramBotToken;
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * Send message to a user
   */
  async sendMessage(chatId: string, message: string, parseMode: 'HTML' | 'Markdown' = 'HTML') {
    try {
      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: parseMode,
      });
      return response.data;
    } catch (error: any) {
      console.error('Telegram sendMessage error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Send photo with caption
   */
  async sendPhoto(chatId: string, photoUrl: string, caption?: string) {
    try {
      const response = await axios.post(`${this.apiUrl}/sendPhoto`, {
        chat_id: chatId,
        photo: photoUrl,
        caption,
        parse_mode: 'HTML',
      });
      return response.data;
    } catch (error: any) {
      console.error('Telegram sendPhoto error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Send document
   */
  async sendDocument(chatId: string, documentUrl: string, caption?: string) {
    try {
      const response = await axios.post(`${this.apiUrl}/sendDocument`, {
        chat_id: chatId,
        document: documentUrl,
        caption,
        parse_mode: 'HTML',
      });
      return response.data;
    } catch (error: any) {
      console.error('Telegram sendDocument error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Send bulk messages to multiple users
   */
  async sendBulkMessage(chatIds: string[], message: string): Promise<{ successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;

    for (const chatId of chatIds) {
      try {
        await this.sendMessage(chatId, message);
        successful++;
      } catch (error) {
        failed++;
      }
    }

    return { successful, failed };
  }

  /**
   * Set webhook for receiving messages
   */
  async setWebhook(webhookUrl: string) {
    try {
      const response = await axios.post(`${this.apiUrl}/setWebhook`, {
        url: webhookUrl,
      });
      return response.data;
    } catch (error: any) {
      console.error('Telegram setWebhook error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get bot info
   */
  async getMe() {
    try {
      const response = await axios.get(`${this.apiUrl}/getMe`);
      return response.data;
    } catch (error: any) {
      console.error('Telegram getMe error:', error.response?.data || error.message);
      throw error;
    }
  }
}

export const telegramService = new TelegramService();