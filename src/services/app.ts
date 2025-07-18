import express, { NextFunction, Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "../config/database";
import { groupRoutes } from "../routes/group.routes";
import { chatSocket } from "../sockets";
import { messageRoutes } from "../routes/message.routes";
import { AuthMiddleware } from "../utils/auth.middleware";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
io.use(AuthMiddleware.verifySocketToken);
chatSocket(io);

app.use(cors());
app.use(express.json());

app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof SyntaxError && err.name === "SyntaxError") {
    // JSON parsing error
    res.status(400).json({ error: "Invalid JSON" });
  }
  next(err); // Forward the error if it's not a JSON parsing error
});

app.use("/groups", groupRoutes);
app.use("/messages", messageRoutes);
app.get("/", (req, res) => {
  res.send("Running !!");
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => console.log(`Chat Service running on port ${PORT}`));
