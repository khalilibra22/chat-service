import Redis from "ioredis";
import logger from "../utils/logger";

const redisOptions = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
};

const redis = new Redis(redisOptions);

redis.on("error", (error) => {
    logger.error({ err: error }, "Redis connection error");
});

redis.on("connect", () => {
    logger.info("Successfully connected to Redis");
});

export default redis;
