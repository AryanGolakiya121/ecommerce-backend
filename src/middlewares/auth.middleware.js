import { UserStatus } from "../constants/enums.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/helper.js";


export const authenticate = async(req, res, next) => {
    try {
        // Check if token is present in header 
        const authHeader = req.header('Authorization');
        if(!authHeader) {
            throw new ApiError(401, "Authorization token is required")
        }

        // Removing bearer keyword
        const token = authHeader.replace("Bearer", '').trim()

        if(!token) {
            throw new ApiError(401, "Access token is requried")
        }

        //Verify token
        const decoded = verifyAccessToken(token);

        // Finding active user with details decoded from token
        const userData = await User.findOne({ _id: decoded.userId, status: UserStatus.ACTIVE }).select("-password -__v")

        if(!userData) {
            throw new ApiError(401, "Invalid access token")
        }

        // Invalidate access tokens created before password change
        if(userData.passwordChangedAt && decoded.iat * 1000 < userData.passwordChangedAt.getTime()) {
            throw new ApiError(401, "Access token is no longer valid. Please login again")
        }
        req.token = token;
        req.user = userData;

        next();
    } catch (error) {
        console.log("Error in authenticate:",error)

        if(error.name === "TokenExpiredError") {
            return next(
                new ApiError(401, "Access token has expired")
            )
        }
        if(error.name === "JsonWebTokenError") {
            return next(
                new ApiError(401, "Invalid access token")
            )
        }
        // if (error.message === "jwt malformed") {
        //     return new ApiError(400, "Invalid access token")
        // } 
        return next(error)


    }
}