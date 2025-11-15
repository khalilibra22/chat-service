import express from "express";
import { MessageController } from "../../controllers/message.controller";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import {
  groupApiMessageValidation,
  privateApiMessageValidation,
} from "../../validations/message.validation";

const router = express.Router();

const messageController = new MessageController();

router.post(
  "/private/:otherUserId",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(privateApiMessageValidation),
  messageController.createPrivateMessage
);

router.get(
  "/private/:otherUserId",
  AuthMiddleware.verifyToken,
  messageController.getPrivateMessageHistory
);

router.post(
  "/group/:groupId",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(groupApiMessageValidation),
  messageController.createGroupMessage
);

router.get("/group/:groupId", AuthMiddleware.verifyToken, messageController.getGroupMessageHistory);

router.get("/chats", AuthMiddleware.verifyToken, messageController.getAllChats);

// View management routes
router.patch("/:messageId/view", AuthMiddleware.verifyToken, messageController.markMessageAsViewed);
router.get("/:messageId/views", AuthMiddleware.verifyToken, messageController.getMessageViews);
router.get("/:messageId/viewed", AuthMiddleware.verifyToken, messageController.checkMessageViewed);

export { router as messageRoutes };

