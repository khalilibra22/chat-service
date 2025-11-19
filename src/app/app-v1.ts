import express from "express";
import { groupRoutes } from "../routes/v1/group.routes";
import { messageRoutes } from "../routes/v1/message.routes";
import { userRoutes } from "../routes/v1/user.routes";


const v1Router = express.Router();

v1Router.use("/groups", groupRoutes);
v1Router.use("/messages", messageRoutes);
v1Router.use("/users", userRoutes);

export { v1Router };