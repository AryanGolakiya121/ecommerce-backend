import User from "../models/User.js"
import ApiError from "../utils/ApiError.js"
import { comparePassword, encrypt } from "../utils/helper.js";
import ApiResponse from "../utils/ApiResponse.js";
import { cloudinary, uploadImgOnCloudinary } from "../utils/cloudinary.js";


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

export const uploadAvatarImage = async(req, res, next) => {
    try {
        if(!req.file) {
            throw new ApiError(400, "Please upload an avatar image")
        }
        const user = await User.findById(req.user._id).select("-__v");
        
        if(!user) {
            throw new ApiError(404, "User not exists")
        }

        const oldPublicId = user.avatar?.publicId;
        // Upload new image to cloudinary
        const localFilePath = req.file.path;
        
        const uploadOnCloud = await uploadImgOnCloudinary(localFilePath, "ecommerce/avatars");

        if(!uploadOnCloud) {
            throw new ApiError(500, "Failed to upload avatar image on cloudinary")
        }

        // Save new avatar in database
        user.avatar = {
            url: uploadOnCloud.secure_url,
            publicId: uploadOnCloud.public_id
        };
        await user.save();

        // Delete old image only after database update success
        if(oldPublicId) {
            try {
                await cloudinary.uploader.destroy(oldPublicId)
            } catch (error) {
                console.log("Failed to delete old avatar image from cloudinary:", error.message)
            }
        }

        return ApiResponse(res, 200, "Avatar image uploaded successfully", user)
    } catch (error) {
        console.log("Error in uploadAvatarImage:",error);
        next(error);
    }
}

export const deleteAvatarImage = async(req, res, next) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select("_id firstName lastName email userName avatar");

        if(!user) {
            throw new ApiError(404, "User not exists");
        }

        if(!user.avatar?.publicId) {
            throw new ApiError(404, "User avatar not found")
        }

        // Delete image from cloudinary
        const response = await cloudinary.uploader.destroy(user.avatar?.publicId);

        if(response.result !== "ok" && response.result !== "not found") {
            throw new ApiError(500, "Failed to delete image from cloudinary");
        }
        // Remove avatar form database
        user.avatar = {
            url: null,
            publicId: null
        };

        user.save();

        return ApiResponse(res, 200, "Avatar deleted successfully", null);
    } catch (error) {
        console.log("Error while deletingAvatarImage:",error);
        next(error);
        
    }
}