import express, { NextFunction, Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "../config/database";
import { v1Router } from "../routes";
import { chatSocket } from "../sockets";
import { AuthMiddleware } from "../utils/auth.middleware";

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("Missing JWT_SECRET env var");
}
if (!process.env.MONGO_URI) {
  console.error("Missing MONGO_URI env var");
}

connectDB();

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.CORS_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean);
const corsOptions = allowedOrigins.length
  ? { origin: allowedOrigins, credentials: true }
  : { origin: "*" } as any;

const io = new Server(server, { cors: corsOptions });
io.use(AuthMiddleware.verifySocketToken);
chatSocket(io);

app.use(cors(corsOptions));
app.use(express.json());

app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof SyntaxError && err.name === "SyntaxError") {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }
  next(err);
});

app.use("/v1", v1Router);
app.get("/", (req, res) => {
  res.send("Running !!");
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => console.log(`Chat Service running on port ${PORT}`));
