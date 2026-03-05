import { Request, Response, NextFunction } from "express";
import logger from "./logger";

/**
 * requireInboundKey
 * -----------------
 * Guards routes that are only meant to be called from other internal services
 * (e.g. user-service syncing user data to chat-service).
 *
 * Reads the shared secret from INBOUND_API_KEY env var and compares it to the
 * `x-internal-api-key` request header.  Mirrors the identical middleware used
 * in user-service and course-service.
 */
export const requireInboundKey = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const INBOUND_API_KEY = process.env.INBOUND_API_KEY;

    if (!INBOUND_API_KEY) {
        // Key not configured in environment → fail secure
        logger.error("[requireInboundKey] INBOUND_API_KEY is not set in .env — blocking all inbound requests.");
        res.status(503).json({ message: "Inbound endpoint not configured" });
        return;
    }

    const provided = req.headers["x-internal-api-key"];

    if (!provided || provided !== INBOUND_API_KEY) {
        logger.warn(
            `[requireInboundKey] Unauthorized inbound request — provided: ${provided ?? "(none)"}`
        );
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    next();
};
