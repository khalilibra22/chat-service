import User, { IUser } from "../models/user.model";
import { UserProfile } from "../types/chat.types";

export class UserService {
  private userServiceUrl: string;
  private cacheExpiryHours: number;

  constructor() {
    this.userServiceUrl = process.env.USER_SERVICE_URL || "https://user-service-dev-ys17.onrender.com/v1";
    this.cacheExpiryHours = parseInt(process.env.USER_CACHE_EXPIRY_HOURS || "24", 10);
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
      console.error(`Error creating user ${payload.userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user profile from local cache only
   */
  async getCachedUserProfile(userId: string): Promise<UserProfile | null> {
    const user = await User.findByUserId(userId);
    if (!user) {
      return null;
    }

    return {
      userId: user.userId,
      name: user.name,
      profileImageUrl: user.profileImageUrl,
      email: user.email,
      metadata: user.metadata,
    };
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
          console.warn(`User ${userId} not found in user service`);
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
      console.error(`Error fetching user ${userId} from user service:`, error);
      throw error;
    }
  }

  /**
   * Check if cached user profile is still valid
   */
  private isCacheValid(user: IUser): boolean {
    const now = new Date();
    const lastFetched = new Date(user.lastFetchedAt);
    const hoursSinceLastFetch = (now.getTime() - lastFetched.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastFetch < this.cacheExpiryHours;
  }

  /**
   * Get user profile from cache or fetch from service
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Check cache first - use findByUserId instead of findById
      const cachedUser = await User.findByUserId(userId);
      
      if (cachedUser && this.isCacheValid(cachedUser)) {
        return {
          userId: cachedUser.userId,
          name: cachedUser.name,
          profileImageUrl: cachedUser.profileImageUrl,
          email: cachedUser.email,
          metadata: cachedUser.metadata,
        };
      }

      // Fetch from service if not in cache or cache expired
      const userProfile = await this.fetchUserFromService(userId);
      
      if (!userProfile) {
        return null;
      }

      // Update cache using upsertProfile to handle existing users
      await User.upsertProfile(userProfile);
      
      return userProfile;
    } catch (error) {
      console.error(`Error getting user profile for ${userId}:`, error);
      
      // If service fails, try to return cached data even if expired
      const cachedUser = await User.findByUserId(userId);
      if (cachedUser) {
        console.warn(`Returning stale cache for user ${userId} due to service error`);
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
    await User.deleteOne({ userId });
  }

  /**
   * Manually update user profile in cache
   */
  async updateUserProfile(userProfile: UserProfile): Promise<void> {
    await User.upsertProfile(userProfile);
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
      console.error(`Error updating user ${payload.userId}:`, error);
      throw error;
    }
  }
}

