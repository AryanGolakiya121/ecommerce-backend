import User from "../models/User.js";
import { Roles, UserStatus } from "../constants/enums.js";
import ApiError from "../utils/ApiError.js";
import { comparePassword, encrypt, generateAccessToken, generateRefreshToken, hashToken, verifyRefreshToken, generateToken } from "../utils/helper.js";
import ApiResponse from "../utils/ApiResponse.js";
import RefreshToken from "../models/RefreshToken.js";
import { refreshTokenCookieOptions } from "../config/cookie.js";
import redisClient from "../config/redis.js";
import sendEmail from '../utils/sendEmail.js';
import env from "../config/env.js";
import emailQueue from "../queues/email.queue.js";
import { addEmailJob } from "../queues/email.jobs.js";
import mongoose from "mongoose";

export const registerUser = async(req, res, next) => {
    try {
        const { firstName, lastName, userName, email, password, phone } = req.body;

        const checkExistingUser = await User.findOne({
            $or: [
                { email },
                { userName },
                { phone }
            ]
        })

        if(checkExistingUser) {
            throw new ApiError(409, "Email or username or phone already exists");
        }

        const hashedPassword = await encrypt(password);

        const createUser = await User.create({
            firstName,
            lastName,
            userName,
            email,
            password: hashedPassword,
            phone: phone,
            role: Roles.CUSTOMER
        })

        const emailVerificationToken = generateToken()
        const emailVerificationTokenHash = hashToken(emailVerificationToken);
        await redisClient.set(
            `email-verification:${emailVerificationTokenHash}`,
            createUser._id.toString(),
            {
                EX: 15 * 60
            }
        )

        const emailVErificationLink = `${env.clientUrl}/verify-email?token=${emailVerificationToken}`;
        const templateData = {
            firstName: createUser.firstName,
            verificationLink: emailVErificationLink
        }
        await addEmailJob({
            email: createUser.email,
            subject: "Verify Your Email",
            templateName: "verify-email",
            templateData
        })
        return ApiResponse(res, 201, "User created successfully", createUser)

        // if(createUser) {
        //     ApiResponse(res, 201, "User created successfully", createUser)
        // }
    } catch (error) {
        console.log("Error while creating of user:",error)
        // throw new ApiError(500, "Internal server error")
        next(error)
    }
}

export const loginUser = async(req, res, next) => {
    try {
        const { input, password } = req.body;

        //check if input is email or not
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)

        const user = await User.findOne({
            $or: [
                { email: isEmail ? input : "" },
                { userName: isEmail ? "" : input }
            ],
        })
        if(!user) {
            throw new ApiError(401, `User not found with input ${input}`)
        }
        if(user.status !== UserStatus.ACTIVE) {
            throw new ApiError(401, `User account is not active`)
        }

        const isPasswordValid = await comparePassword(password, user?.password)
        
        if(!isPasswordValid) {
            throw new ApiError(401, "Password is not valid")
        }
        
        if(!user.isEmailVerified) {
            throw new ApiError(401, `Please first veriy your email to login`)
        }
        const tokenPayload = {
            userId: user._id.toString(),
            role: user.role
        }
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);
        const refreshTokenHash = hashToken(refreshToken);
        const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);


        await RefreshToken.create({
            user: user._id,
            tokenHash: refreshTokenHash,
            expiresAt: refreshTokenExpiresAt,
            createdByIp: req.ip,
            userAgent: req.get("user-agent")
        })

        user.lastLoginAt = new Date();
        await user.save();

        const data = {
            user,
            accessToken,
            // refreshToken
        }
        res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions)
        return ApiResponse(res, 200, "Login successful", data)
    } catch (error) {
        console.log("Error while login:", error);
        next(error);
    }
}

export const refreshToken = async(req, res, next) => {
    try {
        const token = req.cookies.refreshToken;

        if (!token) {
            throw new ApiError(401, "Refresh token is required");
        }
        // const { refreshToken: token } = req.body;

        // 1. Verify JWT signature and expiration
        const decoded = verifyRefreshToken(token);

        // 2. Hash the received refresh token
        const tokenHash = hashToken(token);

        // 3. Find token session in database
        const storedToken = await RefreshToken.findOne({ tokenHash });

        if(!storedToken) {
            throw new ApiError(401, "Invlaid refresh token")
        }

        // 4. Check if token was revoked
        if(storedToken.revokedAt) {
            // throw new ApiError(401, "Refresh token was revoked")
            await RefreshToken.updateMany(
                {
                    user: storedToken.user,
                    revokedAt: null
                },
                {
                    $set: {
                        revokedAt: new Date()
                    }
                }
            );
            throw new ApiError(401, "Refresh token reuse detected. Please login again.")
        }

        // 5. Check database expiration
        if(storedToken.expiresAt <= new Date()) {
            throw new ApiError(401, "Refresh token has expired")
        }

        // 6. Generate new tokens
        const tokenPayload = {
            userId: decoded.userId,
            role: decoded.role
        }
        const newAccessToken = generateAccessToken(tokenPayload);
        const newRefreshToken = generateRefreshToken(tokenPayload);

        // 7. Hash new refresh token
        const newRefreshTokenHash = hashToken(newRefreshToken)

        // 8. Revoke old token
        storedToken.revokedAt = new Date();
        storedToken.replacedByTokenHash = newRefreshTokenHash;
        await storedToken.save();

        // 9. Store new refresh token
        await RefreshToken.create({
            user: storedToken.user,
            tokenHash: newRefreshTokenHash,
            expiresAt: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
            ),
            createdByIp: req.ip,
            userAgent: req.get("user-agent")
        });

        const data = {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        }
        return ApiResponse(res, 200, "Token refreshed successfully", data)
    } catch (error) {
        console.log("Error while refreshing token:",error);
        next(error)
    }
}

export const logoutUser = async(req, res, next) => {
    try {

        const token = req.cookies.refreshToken;
        // const { refreshToken: token } = req.body;
         if (!token) {
            throw new ApiError(401, "Refresh token is required");
        }
        const tokenHash = hashToken(token);
        const storedToken = await RefreshToken.findOne({ tokenHash });

        if(!storedToken) {
            throw new ApiError(401, "Invalid refresh token")
        }
        if(!storedToken.revokedAt) {
            storedToken.revokedAt = new Date();

            await storedToken.save();
        }
        res.clearCookie("refreshToken", refreshTokenCookieOptions)
        return ApiResponse(res, 200, "Logout successful")
    } catch (error) {
        console.log("Error while logout:",error);
        next(error)
        
    }
}

export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email }).select("-password -__v");

        if(!user) {
            throw new ApiError(401, "Email is not registered");
        }
        const resetToken = generateToken();
        const tokenHash = hashToken(resetToken);
        const redisKey = `password-reset:${tokenHash}`;

        await redisClient.set(redisKey, user._id.toString(), { EX: 15 * 60 });

        const resetLink = `${env.clientUrl}/reset-password?token=${resetToken}`
        
        const emailData = {
            firstName: user.firstName,
            resetLink,
        }
        // await sendEmail(
        //     user.email,
        //     "Reset Your Password",
        //     "reset-password",
        //     emailData
        // )
        // await emailQueue.add("reset-password", {
        //     email: user.email,
        //     subject: "Reset Your Password",
        //     templateName: "reset-password",
        //     templateData: emailData
        // })
        await addEmailJob({
            email: user.email,
            subject: "Reset Your Password",
            templateName: "reset-password",
            templateData: {
                firstName: user.firstName,
                resetLink
            }
        })
        
        return ApiResponse(res, 200, "Please check your email, password reset link has been sent")
    } catch (error) {
        console.log("Error while forgotPassword:",error)
        // throw new ApiError(500, error.message)
        next(error)
    }
}

export const resetPassword = async(req, res, next) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;

        // 1. Hash the token received from the user
        const tokenHash = hashToken(token);

        // 2. Create redis key
        const redisKey = `password-reset:${tokenHash}`;

        // 3. Get userId from redis
        const userId = await redisClient.get(redisKey);

        if(!userId) {
            throw new ApiError(400, "Invalid or expired reset password token");
        }

        // // 4. Make both password match
        if(newPassword !== confirmPassword) {
            throw new ApiError(400, "New password and confirm password do not match");
        }

        // 5. Find user
        const user = await User.findById(userId)

        if(!user) {
            throw new ApiError(404, "User not found");
        }

        // 6. Hash new password
        user.password = await encrypt(newPassword);

        // 7. Invalidate existing access tokens
        user.passwordChangedAt = new Date();

        await user.save();

        // 8. Revok all refresh tokens
        await RefreshToken.updateMany(
            {
                user: user._id,
                revokedAt: null
            },
            {
                $set: {
                    revokedAt: new Date()
                }
            }
        );

        // 9 Delete reset token from redis
        await redisClient.del(redisKey);
        
        return ApiResponse(res, 200, "Password reset successfully")

    } catch (error) {
        console.log("Error while resetPassword:",error);
        next(error);
    }
}

export const verifyEmail = async(req, res, next) => {
    try {
        const { token } = req.query;
        if(!token) {
            throw new ApiError(400, "Verification token is required")
        }

        // Hash the token received from the email
        const tokenHash = hashToken(token);

        // Find userId from redis;
        const userId = await redisClient.get(`email-verification:${tokenHash}`);

        if(!userId) {
            throw new ApiError(400, "Invalid or expired verification token");
        }

        const user = await User.findById(userId).select("-__v");
        if(!user) {
            throw new ApiError(404, "User not found")
        }

        // If user is already verified then delete it from redis
        if(user.isEmailVerified) {
            await redisClient.del(`email-verification:${tokenHash}`);

            return ApiResponse(res, 200, "Email is already verified", null);
        }

        // Mark email as verified
        user.isEmailVerified = true;
        user.save();

        // Delete token after successfull verification
        await redisClient.del(`email-verification:${tokenHash}`);

        return ApiResponse(res, 200, "Email verified successfully", null);
    } catch (error) {
        console.log("Error while verifyEmail: error");
        next(error);
    }
}

export const resendVerificationEmail = async(req, res, next) => {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ email });

        if(!user) {
            throw new ApiError(404, "User not exists");
        }

        if(user?.isEmailVerified) {
            return ApiResponse(res, 200, "Email is already verified");
        }

        // Generate new verification token
        const emailVerificationToken = generateToken();

        // Hash the token before storing it in Redis
        const emailVerificationTokenToHash = hashToken(emailVerificationToken);

        // Store token for 15 Minutes
        await redisClient.set(
            `email-verification:${emailVerificationTokenToHash}`, 
            user._id.toString(),
            { 
                EX: 15 * 60
            }
        );

        // Create verification Link
        const emailVerificationLink = `${env.clientUrl}/verify-email?token=${emailVerificationToken}`;

        const templateData = {
            firstName: user.firstName,
            verificationLink: emailVerificationLink
        }
        // Add email to BullMQ
        await addEmailJob({
            email: user.email,
            subject: "Verify Your Email",
            templateName: "verify-email",
            templateData
        })

        return ApiResponse(res, 200, "Email verification link has been resend successfully")
    } catch (error) {
        console.log("Error while resendVerificationEmail:",error);
        next(error);
    }
}