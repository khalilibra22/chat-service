import express from "express";
import { GroupController } from "../controllers/group.controller";
import { AuthMiddleware } from "../utils/auth.middleware";

const router = express.Router();

const groupController = new GroupController();

router.post("/", AuthMiddleware.verifyToken, groupController.createChatGroup);

router.get("/", AuthMiddleware.verifyToken, groupController.getUserGroups);

export { router as groupRoutes };
