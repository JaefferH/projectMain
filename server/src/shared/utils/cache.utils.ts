// src/shared/utils/cache.utils.ts
import { redis } from '../../config/redis';

class CacheUtils {
  private static isRedisAvailable = true;

  /**
   * Get or set cache
   */
  static async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    if (!this.isRedisAvailable) {
      return fetchFn();
    }

    try {
      const cached = await redis.get(key);
      if (cached) {
        console.log(`Cache HIT: ${key}`);
        return JSON.parse(cached) as T;
      }

      console.log(`Cache MISS: ${key}`);
      const data = await fetchFn();

      if (data !== null && data !== undefined) {
        await redis.setex(key, ttlSeconds, JSON.stringify(data));
      }

      return data;
    } catch (error: any) {
      this.isRedisAvailable = false;
      return fetchFn();
    }
  }

  /**
   * Set cache
   */
  static async set(key: string, data: any, ttlSeconds: number = 300): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  /**
   * Get cache
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) as T : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete cache key(s)
   */
  static async delete(...keys: string[]): Promise<void> {
    try {
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.warn('Cache delete error:', error);
    }
  }

  /**
   * Invalidate by pattern
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Invalidated ${keys.length} keys matching: ${pattern}`);
      }
    } catch (error) {
      console.warn('Cache invalidation error:', error);
    }
  }

  /**
   * Cache key generators
   */
  static keys = {
    user: (userId: string) => `user:${userId}`,
    userProfile: (userId: string) => `user:${userId}:profile`,
    userPermissions: (userId: string) => `user:${userId}:permissions`,
    userRoles: (userId: string) => `user:${userId}:roles`,
    dashboard: (userId: string) => `dashboard:${userId}`,
    timetable: {
      student: (classroomId: string) => `timetable:student:${classroomId}`,
      teacher: (teacherId: string) => `timetable:teacher:${teacherId}`,
    },
    announcements: (userId: string) => `announcements:${userId}`,
    feeSchedule: (academicYearId: string) => `feeSchedule:${academicYearId}`,
    calendar: (branchId: string, month: string) => `calendar:${branchId}:${month}`,
    classroomStudents: (classroomId: string) => `classroom:${classroomId}:students`,
  };
}

export { CacheUtils };