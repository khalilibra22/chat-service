import express from "express";
import { MessageController } from "../controllers/message.controller";
import { AuthMiddleware } from "../utils/auth.middleware";
import { ValidationMiddleware } from "../utils/validation.middleware";
import {
  groupApiMessageValidation,
  privateApiMessageValidation,
} from "../validations/message.validation";

const router = express.Router();

const messageController = new MessageController();

router.post(
  "/private/:otherUserId",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(privateApiMessageValidation),
  async (req, res) => messageController.createPrivateMessage(req, res)
);

router.get(
  "/private/:otherUserId",
  AuthMiddleware.verifyToken,
  async (req, res) => messageController.getPrivateMessageHistory(req, res)
);

router.post(
  "/group/:groupId",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(groupApiMessageValidation),
  async (req, res) => messageController.createGroupMessage(req, res)
);

router.get("/group/:groupId", AuthMiddleware.verifyToken, async (req, res) =>
  messageController.getGroupMessageHistory(req, res)
);

router.get("/chats", AuthMiddleware.verifyToken, async (req, res) =>
  messageController.getAllChats(req, res)
);

export { router as messageRoutes };
