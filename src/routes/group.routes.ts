import express from "express";
import Group from "../models/group.model";

const router = express.Router();

router.post("/", async (req, res) => {
  const { name, members } = req.body;
  const group = await Group.create({ name, members });
  res.json(group);
});

router.get("/", async (req, res) => {
  const userId = (req as any).user.id;
  const groups = await Group.find({ members: userId });
  res.json(groups);
});

export { router as groupRoutes };
