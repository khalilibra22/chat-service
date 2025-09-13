import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not set");
    }
    const dbName = process.env.MONGO_DB || "chat";
    await mongoose.connect(mongoUri, { dbName });
    console.log("Chat Database connected");
  } catch (error) {
    console.error("DB connection error:", error);
  }
};

export default connectDB;
