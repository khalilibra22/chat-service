import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";
import logger from "./logger";

class ValidationMiddleware {
  static validate(schema: Schema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
          res.status(400).json({
            error: error.details.map((detail) => detail.message),
          });
          return;
        }
        next();
      } catch (err) {
        logger.error({ err }, "Validation Middleware Error");
        res.status(500).json({ error: "Internal Server Error" });
      }
    };
  }
  static validateSocket(schema: Schema) {
    return (data: any, callback: (error?: string) => void): void => {
      try {
        const { error } = schema.validate(data, { abortEarly: false });
        if (error) {
          const errorMessage = error.details
            .map((detail) => detail.message)
            .join(", ");
          callback(errorMessage);
          return;
        }
        callback();
      } catch (err) {
        logger.error({ err }, "Socket Validation Error");
        callback("Validation failed");
      }
    };
  }
}

export { ValidationMiddleware };
