import app from "./app.js";
import {connectDatabase, disconnectDatabase } from "./config/database.js";
import { conectRedis, disconnectRedis } from "./config/redis.js"
import env from "./config/env.js";
import emailWorker from "./workers/email.worker.js";
import bullmqConnection from "./config/bullmq.js";

let server;

const startServer = async() => {
    try {
        await connectDatabase();

        await conectRedis()

        server = app.listen(env.port, () => {
            console.log(`Server is running on port ${env.port}`)
        })
    } catch (error) {
        console.log("Server startup failed: ",error.message)
        process.exit(1)
    }
}

const gracefulShutdown = async (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);

    if(server) {
        server.close(async () => {
            await emailWorker.close();
            console.log("Email worker closed");

            await bullmqConnection.quit();
            console.log("BullMQ Redis connection closed");

            await disconnectRedis();
            
            await disconnectDatabase();
            console.log("HTTP server closßed");
            process.exit(0);
        });
    } else {
        await disconnectDatabase();
        process.exit(0);
    }
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

startServer();