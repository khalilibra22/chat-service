import { Schema, model, Document, Model } from "mongoose";

export interface IUser extends Document {
  userId: string;
  name: string;
  profileImageUrl?: string;
  email?: string;
  metadata?: Record<string, any>;
  lastFetchedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserModel extends Model<IUser> {
  findByUserId(userId: string): Promise<IUser | null>;
  upsertProfile(userData: Partial<IUser>): Promise<IUser>;
}

const userSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    profileImageUrl: { type: String },
    email: { type: String, index: true, sparse: true },
    metadata: { type: Schema.Types.Mixed },
    lastFetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index for cache validity checks (userId + lastFetchedAt)
userSchema.index({ userId: 1, lastFetchedAt: 1 });

// Static method for upserting user profile
userSchema.statics.upsertProfile = async function (userData: Partial<IUser>) {
  const user = await this.findOneAndUpdate(
    { userId: userData.userId },
    { ...userData, lastFetchedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return user;
};

// Static method for finding by userId
userSchema.statics.findByUserId = async function (userId: string) {
  return this.findOne({ userId });
};

export default model<IUser, IUserModel>("User", userSchema);

