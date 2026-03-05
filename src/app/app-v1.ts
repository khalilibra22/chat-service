import express from "express";
import { groupRoutes } from "../routes/v1/group.routes";
import { messageRoutes } from "../routes/v1/message.routes";
import { userRoutes } from "../routes/v1/user.routes";
import { requireInboundKey } from "../utils/inbound-api-key.middleware";


const v1Router = express.Router();

v1Router.use("/groups", requireInboundKey, groupRoutes); // 🔒 service-to-service only
v1Router.use("/messages", messageRoutes);
v1Router.use("/users", requireInboundKey, userRoutes); // 🔒 service-to-service only

export { v1Router };