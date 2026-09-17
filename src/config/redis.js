import { createClient }  from "redis";

const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379"
})

redisClient.on("error", (error) => {
    console.log("Redis client error:",error)
})

export const conectRedis = async() => {
    if(!redisClient.isOpen) {
        await redisClient.connect();
    }
    console.log("Redis connected successfully");
}

export const disconnectRedis = async() => {
    if(redisClient.isOpen) {
        await redisClient.quit();
    }

    console.log("Redis connection closed");
}

export default redisClient;