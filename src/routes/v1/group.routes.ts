import express from "express";
import { GroupController } from "../../controllers/group.controller";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { createGroupValidation } from "../../validations/group.validation";

const router = express.Router();

const groupController = new GroupController();

router.post(
  "/",
  ValidationMiddleware.validate(createGroupValidation),
  groupController.createChatGroup
);

router.get("/", AuthMiddleware.verifyToken, groupController.getUserGroups);

router.post("/:groupId/join", groupController.joinGroup);

export { router as groupRoutes };

