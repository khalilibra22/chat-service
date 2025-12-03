import mongoose from "mongoose";
import logger from "../utils/logger";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not set");
    }
    const dbName = process.env.MONGO_DB || "chat";
    await mongoose.connect(mongoUri, { dbName });
    logger.info("Chat Database connected");
  } catch (error) {
    logger.error({ err: error }, "DB connection error");
  }
};

export default connectDB;
