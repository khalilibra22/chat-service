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
        createdAt: user.createdAt,
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
}

