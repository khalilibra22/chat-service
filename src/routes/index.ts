import express from "express";
import { groupRoutes } from "./v1/group.routes";
import { messageRoutes } from "./v1/message.routes";

const v1Router = express.Router();

v1Router.use("/groups", groupRoutes);
v1Router.use("/messages", messageRoutes);

export { v1Router };

