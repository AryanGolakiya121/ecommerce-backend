import User from "../models/User.js"
import ApiError from "../utils/ApiError.js"
import { comparePassword, encrypt } from "../utils/helper.js";
import ApiResponse from "../utils/ApiResponse.js";


export const getMyProfile = async(req, res, next ) => {
    try {
        
        const user = await User.findById(req.user._id).select("-password -__v")
        
        if(!user) {
            throw new ApiError(404, "User not found");
        }

        return ApiResponse(res, 200, "Profile fetched successfully", user)
    } catch (error) {
        console.log("Error in getMyProfile:",error);
        next(error)
    }
}
export const changePassword = async(req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select("-__v")
        if(!user) {
            throw new ApiError(401, "User not found");
        }
        const isPasswordValid = await comparePassword(currentPassword, user.password)

        if(!isPasswordValid) {
            throw new ApiError(400, "Current password is incorrect")
        }

        const hashedPassword = await encrypt(newPassword)
        user.password = hashedPassword;
        user.passwordChangedAt = new Date();
        await user.save();

        return ApiResponse(res, 200, "Password changed successfully")
    } catch (error) {
        console.log("Error while changePassword:",error);
        next(error)
        
    }
}

export const updateMyProfile = async(req, res, next) => {
    try {
        const { firstName, lastName, phone } = req.body;
        const user = await User.findById(req.user._id).select("-password -__v");

        if(!user) {
            throw new ApiError(404, "User not found")
        }

        // Check phone number uniqueness only when phone is provided
        if(phone !== undefined && user.phone !== phone) {
            const existingUser = await User.findOne({
                phone,
                _id: { $ne: req.user._id }
            })
            if(existingUser) {
                throw new ApiError(409, "Phone number is already registered")
            }
            user.phone = phone;
        }

        if(firstName !== undefined) {
            user.firstName = firstName;
        }
        if(lastName !== undefined) {
            user.lastName = lastName
        }

        if(phone !== undefined) {
            user.phone = phone
        }

        await user.save();

        return ApiResponse(res, 200, "Profile updated successfully", user)

    } catch (error) {
        console.log("Error in updateMyProfile");
        next(error);
    }
}