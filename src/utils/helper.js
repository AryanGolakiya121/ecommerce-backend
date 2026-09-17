import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import crypto from "node:crypto";

export const encrypt = async(password) => {
    return await bcrypt.hash(password, 12)
}

export const comparePassword = async(plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword)
}

export const generateAccessToken = (payload) => {
    return jwt.sign(
        payload,
        env.jwt.accessSecret,
        {
            expiresIn: env.jwt.accessExpiresIn
        }
    )
}

export const generateRefreshToken = (payload) => {
    return jwt.sign(
        payload,
        env.jwt.refreshSecret,
        {
            expiresIn: env.jwt.refreshExpiresIn
        }
    )
}

export const verifyAccessToken = (token) => {
    return jwt.verify(token, env.jwt.accessSecret)
}

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, env.jwt.refreshSecret)
}

export const hashToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex")
}

export const generateToken = () => {
    return crypto.randomBytes(32).toString("hex")
}