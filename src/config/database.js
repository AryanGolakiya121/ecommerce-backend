import mongoose from "mongoose";
import env from "./env.js";

const connectDatabase = async () => {
    try {
        await mongoose.connect(env.mongoUri);
        console.log("MongoDB connected successfully");
        
    } catch (error) {
        console.log("MongoDb connection failed: ",error.message);
        // process.exit(1)
        throw error;
    }
}

const disconnectDatabase = async () => {
    try {
        await mongoose.connection.close()
        console.log("MongoDB connection closed");
    } catch (error) {
        console.error("MongoDB disconnection failed:", error.message);
    }
}

export {
    connectDatabase,
    disconnectDatabase
};