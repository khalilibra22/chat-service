import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "../config/database";
import { groupRoutes } from "../routes/group.routes";
import { chatSocket } from "../sockets";
import { messageRoutes } from "../routes/massage.routes";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

chatSocket(io);

app.use(cors());
app.use(express.json());

app.use("/groups", groupRoutes);
app.use("/messages", messageRoutes);

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => console.log(`Chat Service running on port ${PORT}`));
