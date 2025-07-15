import express from "express";
import { MessageController } from "../controllers/message.controller";

const router = express.Router();

const messageController = new MessageController();

router.post("/private", async (req, res) =>
  messageController.createPrivateMessage(req, res)
);

router.get("/private/:otherUserId", async (req, res) =>
  messageController.getPrivateMessageHistory(req, res)
);

router.post("/group", async (req, res) =>
  messageController.createGroupMessage(req, res)
);

router.get("/group/:groupId", async (req, res) =>
  messageController.getGroupMessageHistory(req, res)
);

router.get("/chats", async (req, res) =>
  messageController.getAllChats(req, res)
);

export { router as messageRoutes };
