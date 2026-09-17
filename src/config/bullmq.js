import IORedis from "ioredis";
import env from "./env.js";

const bullmqConnection = new IORedis(
    env.redisUrl || "redis://127.0.0.1:6379",
    {
        maxRetriesPerRequest: null
    }
);

bullmqConnection.on("connect", () => {
    console.log("BullMQ Redis connected successfully");
});

bullmqConnection.on("error", (error) => {
    console.log("BullMQ Redis error:", error);
});

export default bullmqConnection;