import mongoose from "mongoose";
import { Roles, UserStatus } from "../constants/enums.js";

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            trim: true
        },
        lastName: {
            type: String,
            trim: true
        },
        userName: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true,
            index: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: Object.values(Roles),
            default: Roles.CUSTOMER
        },
        phone: {
            type: String,
            trim: true,
            default: null
        },
        avatar: {
            url: {
                type: String,
                default: null
            },
            publicId: {
                type: String,
                default: null
            }
        },
        // isActive: {
        //     type: Boolean,
        //     default: true
        // },
        status: {
            type: String,
            enum: Object.values(UserStatus),
            default: UserStatus.ACTIVE
        },
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        lastLoginAt: {
            type: Date,
            default: null
        },
        passwordChangedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

export default User;