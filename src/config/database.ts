import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://chat-service-user:wQZZKaaUGjkweRL4@chat-app-db.oxn85wa.mongodb.net"
    );
    console.log("DB connected");
  } catch (error) {
    console.error("DB connection error:", error);
  }
};

export default connectDB;
