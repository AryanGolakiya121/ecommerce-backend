import mongoose from "mongoose";
import env from "../config/env.js";
import User from "../models/User.js";
import { Roles, UserStatus } from "../constants/enums.js";
import { encrypt } from "../utils/helper.js";

const createAdmin = async () => {
    try {
        await mongoose.connect(env.mongoUri);

        console.log("MongoDB Connected");
        const adminEmail = "admin@gmail.com";
        const adminUsername = "admin";
        const adminPassword = "Admin@123";

        const existingAdmin = await User.findOne({
            $or: [
                { email: adminEmail },
                { userName: adminUsername }
            ]
        })
        if (existingAdmin) {
            console.log("Admin already exists");
            process.exit(0);
        }

        const hashPassword = await encrypt(adminPassword);

        const admin = await User.create({
            firstName: "admin",
            lastName: "user",
            userName: adminUsername,
            email: adminEmail,
            password: hashPassword,
            role: Roles.ADMIN,
            status: UserStatus.ACTIVE,
            isEmailVerified: true
        });

        console.log("Admin created successfully")

        process.exit(0)
    } catch (error) {
        console.error("Error creating admin:", error);
        process.exit(1);
    }
}

// createAdmin();