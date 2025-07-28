import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

class AuthMiddleware {
  static async decodeToken(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        resolve(decoded);
      } catch (error) {
        reject(error);
      }
    });
  }

  static async verifyToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        res.status(401).json({ message: "Invalid or expired token" });
        return;
      }

      const decoded = await AuthMiddleware.decodeToken(token);
      req.params.userId = decoded.id;
      next();
    } catch (error) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }
  }

  static async verifySocketToken(
    socket: any,
    next: (err?: any) => void
  ): Promise<void> {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Invalid or expired token"));
      }

      const decoded = await AuthMiddleware.decodeToken(token);
      socket.data.userId = decoded.id;
      next();
    } catch (error) {
      return next(new Error("Invalid or expired token"));
    }
  }
}
export { AuthMiddleware };
