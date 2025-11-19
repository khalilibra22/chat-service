import express from "express";
import { UserController } from "../../controllers/user.controller";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { createUserValidation, updateUserValidation } from "../../validations/user.validation";

const router = express.Router();
const userController = new UserController();

router.post(
  "/",
  ValidationMiddleware.validate(createUserValidation),
  userController.createUser
);

router.put(
  "/:userId",
  ValidationMiddleware.validate(updateUserValidation),
  userController.updateUser
);

export { router as userRoutes };

