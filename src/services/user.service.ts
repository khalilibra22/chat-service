import User, { IUser } from "../models/user.model";
import { UserProfile, UserStatus } from "../types/chat.types";
import redis from "../config/redis";
import logger from "../utils/logger";

export class UserService {
  private userServiceUrl: string;
  private cacheExpirySeconds: number;
  private statusExpirySeconds: number = 300; // 5 minutes

  constructor() {
    this.userServiceUrl = process.env.USER_SERVICE_URL || "https://user-service-dev-ys17.onrender.com/v1";
    this.cacheExpirySeconds = parseInt(process.env.USER_CACHE_EXPIRY_SECONDS || "86400", 10); // 24 hours
  }

  /**
   * Create a new user record locally
   */
  async createUser(payload: {
    userId: string;
    fullname: string;
    email: string;
    profileImage?: string;
  }): Promise<IUser> {
    try {
      const existingUser = await User.findOne({ userId: payload.userId });
      if (existingUser) {
        throw new Error("User already exists");
      }

      const user = await User.create({
        userId: payload.userId,
        name: payload.fullname,
        email: payload.email,
        profileImageUrl: payload.profileImage,
      });

      return user;
    } catch (error) {
      logger.error({ err: error }, `Error creating user ${payload.userId}`);
      throw error;
    }
  }

  /**
   * Get user profile from Redis cache
   */
  async getCachedUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const cachedData = await redis.get(`user:${userId}`);
      if (cachedData) {
        return JSON.parse(cachedData) as UserProfile;
      }

      // If not in Redis, try local DB (as secondary cache) or fetch from service
      return this.getUserProfile(userId);
    } catch (error) {
      logger.error({ err: error }, `Redis error for user ${userId}`);
      // Fallback to standard flow
      return this.getUserProfile(userId);
    }
  }

  async getCachedUserProfiles(userIds: string[]): Promise<Map<string, UserProfile>> {
    const profiles = new Map<string, UserProfile>();
    const users = await User.find({ userId: { $in: userIds } });
    users.forEach((user) => {
      profiles.set(user.userId, {
        userId: user.userId,
        name: user.name,
        profileImageUrl: user.profileImageUrl,
        email: user.email,
        metadata: user.metadata,
      });
    });
    return profiles;
  }

  /**
   * Fetch user profile from external user service
   */
  private async fetchUserFromService(userId: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${this.userServiceUrl}/users/${userId}/minimal`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          logger.warn(`User ${userId} not found in user service`);
          return null;
        }
        throw new Error(`User service responded with status ${response.status}`);
      }

      const data = await response.json();

      // Map the response to our UserProfile interface
      return {
        userId: data.id || data.userId || userId,
        name: data.name || data.username || "Unknown User",
        profileImageUrl: data.profileImageUrl || data.avatar || data.profileImage,
        email: data.email,
        metadata: data.metadata || {},
      };
    } catch (error) {
      logger.error({ err: error }, `Error fetching user ${userId} from user service`);
      throw error;
    }
  }

  /**
   * Check if cached user profile is still valid
   */
  private isCacheValid(user: IUser): boolean {
    const now = new Date();
    const lastFetched = new Date(user.lastFetchedAt);
    const secondsSinceLastFetch = (now.getTime() - lastFetched.getTime()) / 1000;
    return secondsSinceLastFetch < this.cacheExpirySeconds;
  }

  /**
   * Get user profile from cache or fetch from service
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Check Redis first (redundant if called from getCachedUserProfile but good for direct calls)
      const cachedData = await redis.get(`user:${userId}`);
      if (cachedData) {
        return JSON.parse(cachedData) as UserProfile;
      }

      // Check local DB (secondary cache)
      const cachedUser = await User.findByUserId(userId);

      if (cachedUser && this.isCacheValid(cachedUser)) {
        const profile: UserProfile = {
          userId: cachedUser.userId,
          name: cachedUser.name,
          profileImageUrl: cachedUser.profileImageUrl,
          email: cachedUser.email,
          metadata: cachedUser.metadata,
        };
        // Populate Redis
        await redis.set(`user:${userId}`, JSON.stringify(profile), "EX", this.cacheExpirySeconds);
        return profile;
      }

      // Fetch from service if not in cache or cache expired
      const userProfile = await this.fetchUserFromService(userId);

      if (!userProfile) {
        return null;
      }

      // Update local DB
      await User.upsertProfile(userProfile);

      // Update Redis
      await redis.set(`user:${userId}`, JSON.stringify(userProfile), "EX", this.cacheExpirySeconds);

      return userProfile;
    } catch (error) {
      logger.error({ err: error }, `Error getting user profile for ${userId}`);

      // If service fails, try to return cached data even if expired
      const cachedUser = await User.findByUserId(userId);
      if (cachedUser) {
        logger.warn(`Returning stale cache for user ${userId} due to service error`);
        return {
          userId: cachedUser.userId,
          name: cachedUser.name,
          profileImageUrl: cachedUser.profileImageUrl,
          email: cachedUser.email,
          metadata: cachedUser.metadata,
        };
      }

      return null;
    }
  }

  /**
   * Ensure user profile exists in cache (fetch if needed)
   * This is the main method to be used by other services
   */
  async ensureUserProfile(userId: string): Promise<UserProfile | null> {
    return this.getUserProfile(userId);
  }

  /**
   * Batch fetch multiple user profiles
   */
  async ensureUserProfiles(userIds: string[]): Promise<Map<string, UserProfile>> {
    const profiles = new Map<string, UserProfile>();

    // Fetch all profiles in parallel
    const results = await Promise.allSettled(
      userIds.map(userId => this.ensureUserProfile(userId))
    );

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        profiles.set(userIds[index], result.value);
      }
    });

    return profiles;
  }

  /**
   * Invalidate cache for a specific user (force refresh on next fetch)
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await Promise.all([
      User.deleteOne({ userId }),
      redis.del(`user:${userId}`)
    ]);
  }

  /**
   * Manually update user profile in cache
   */
  async updateUserProfile(userProfile: UserProfile): Promise<void> {
    await Promise.all([
      User.upsertProfile(userProfile),
      redis.set(`user:${userProfile.userId}`, JSON.stringify(userProfile), "EX", this.cacheExpirySeconds)
    ]);
  }

  /**
   * Update an existing user record
   */
  async updateUser(payload: {
    userId: string;
    fullname?: string;
    email?: string;
    profileImage?: string;
  }): Promise<IUser> {
    try {
      const existingUser = await User.findOne({ userId: payload.userId });
      if (!existingUser) {
        throw new Error("User not found");
      }

      const updateData: any = {
        lastFetchedAt: new Date(),
      };

      if (payload.fullname !== undefined) {
        updateData.name = payload.fullname;
      }
      if (payload.email !== undefined) {
        updateData.email = payload.email;
      }
      if (payload.profileImage !== undefined) {
        updateData.profileImageUrl = payload.profileImage;
      }

      const updatedUser = await User.findOneAndUpdate(
        { userId: payload.userId },
        updateData,
        { new: true }
      );

      if (!updatedUser) {
        throw new Error("Failed to update user");
      }

      return updatedUser;
    } catch (error) {
      logger.error({ err: error }, `Error updating user ${payload.userId}`);
      throw error;
    }
  }

  /**
   * Set user as online (called when socket connects)
   */
  async setUserOnline(userId: string): Promise<void> {
    try {
      const now = new Date();

      // Set in Redis with 5-minute expiration (auto-cleanup for stale connections)
      await redis.set(
        `user:status:${userId}`,
        JSON.stringify({ isOnline: true, timestamp: now.toISOString() }),
        "EX",
        this.statusExpirySeconds
      );

      // Update MongoDB with lastSeenAt
      await User.findOneAndUpdate(
        { userId },
        { isOnline: true, lastSeenAt: now },
        { upsert: true }
      );

      logger.info(`User ${userId} is now online`);
    } catch (error) {
      logger.error({ err: error }, `Error setting user ${userId} online`);
      throw error;
    }
  }

  /**
   * Set user as offline (called when socket disconnects)
   */
  async setUserOffline(userId: string): Promise<void> {
    try {
      const now = new Date();

      // Remove from Redis
      await redis.del(`user:status:${userId}`);

      // Update MongoDB with lastSeenAt
      await User.findOneAndUpdate(
        { userId },
        { isOnline: false, lastSeenAt: now },
        { upsert: true }
      );

      logger.info(`User ${userId} is now offline`);
    } catch (error) {
      logger.error({ err: error }, `Error setting user ${userId} offline`);
      throw error;
    }
  }

  /**
   * Get user online status
   */
  async getUserStatus(userId: string): Promise<UserStatus> {
    try {
      // Check Redis first for real-time status
      const redisStatus = await redis.get(`user:status:${userId}`);

      if (redisStatus) {
        return {
          userId,
          isOnline: true,
          lastSeenAt: undefined, // Online users don't need lastSeenAt
        };
      }

      // If not in Redis, user is offline - get lastSeenAt from MongoDB
      const user = await User.findOne({ userId });

      return {
        userId,
        isOnline: false,
        lastSeenAt: user?.lastSeenAt,
      };
    } catch (error) {
      logger.error({ err: error }, `Error getting status for user ${userId}`);
      // Return offline status on error
      return {
        userId,
        isOnline: false,
      };
    }
  }

  /**
   * Get bulk user statuses
   */
  async getBulkUserStatus(userIds: string[]): Promise<Map<string, UserStatus>> {
    try {
      const statusMap = new Map<string, UserStatus>();

      // Get all Redis keys at once
      const redisKeys = userIds.map(id => `user:status:${id}`);
      const redisResults = await Promise.all(
        redisKeys.map(key => redis.get(key))
      );

      // Track which users are offline (not in Redis)
      const offlineUserIds: string[] = [];

      userIds.forEach((userId, index) => {
        if (redisResults[index]) {
          // User is online
          statusMap.set(userId, {
            userId,
            isOnline: true,
          });
        } else {
          // User is offline, need to get lastSeenAt from MongoDB
          offlineUserIds.push(userId);
        }
      });

      // Batch fetch lastSeenAt for offline users
      if (offlineUserIds.length > 0) {
        const offlineUsers = await User.find(
          { userId: { $in: offlineUserIds } },
          { userId: 1, lastSeenAt: 1 }
        );

        offlineUsers.forEach(user => {
          statusMap.set(user.userId, {
            userId: user.userId,
            isOnline: false,
            lastSeenAt: user.lastSeenAt,
          });
        });

        // For users not found in DB, set default offline status
        offlineUserIds.forEach(userId => {
          if (!statusMap.has(userId)) {
            statusMap.set(userId, {
              userId,
              isOnline: false,
            });
          }
        });
      }

      return statusMap;
    } catch (error) {
      logger.error({ err: error }, "Error getting bulk user status");
      // Return empty map on error
      return new Map();
    }
  }
}

