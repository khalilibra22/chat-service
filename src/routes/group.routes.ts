import express from "express";
import { GroupController } from "../controllers/group.controller";

const router = express.Router();

const groupController = new GroupController();

router.post("/", async (req, res) => groupController.createChatGroup(req, res));

router.get("/", async (req, res) => groupController.getUserGroups(req, res));

export { router as groupRoutes };
