import { Request, Response } from "express";
import { UserService } from "../services/user.service";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, fullname, email, profileImage } = req.body;

      const user = await this.userService.createUser({
        userId,
        fullname,
        email,
        profileImage,
      });

      res.status(201).json({
        userId: user.userId,
        fullname: user.name,
        email: user.email,
        profileImage: user.profileImageUrl,
        createdAt: (user as any).createdAt,
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      const message = error?.message || "Internal Server Error";

      const statusMap: Record<string, number> = {
        "User already exists": 409,
      };

      const status = statusMap[message] || 500;
      res.status(status).json({ error: message });
    }
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { fullname, email, profileImage } = req.body;

      const user = await this.userService.updateUser({
        userId,
        fullname,
        email,
        profileImage,
      });

      res.status(200).json({
        userId: user.userId,
        fullname: user.name,
        email: user.email,
        profileImage: user.profileImageUrl,
        updatedAt: (user as any).updatedAt,
      });
    } catch (error: any) {
      console.error("Error updating user:", error);
      const message = error?.message || "Internal Server Error";

      const statusMap: Record<string, number> = {
        "User not found": 404,
        "Failed to update user": 500,
      };

      const status = statusMap[message] || 500;
      res.status(status).json({ error: message });
    }
  };
}

