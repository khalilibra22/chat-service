import express from "express";
import { UserController } from "../../controllers/user.controller";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { createUserValidation } from "../../validations/user.validation";

const router = express.Router();
const userController = new UserController();

router.post(
  "/",
  ValidationMiddleware.validate(createUserValidation),
  userController.createUser
);

export { router as userRoutes };

