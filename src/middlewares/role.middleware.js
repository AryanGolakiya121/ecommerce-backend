import { Roles } from "../constants/enums.js";
import ApiError from "../utils/ApiError.js";

export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if(!req.user) {
            return next(
                new ApiError(401, "Authentication required")
            )
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(
                new ApiError(403, "You do not have permission to access this resource")
            )
        }

        next();
    }
}

export const admin = authorizeRoles(Roles.ADMIN, Roles.SUPER_ADMIN);
export const customer = authorizeRoles(Roles.CUSTOMER);
export const superAdmin = authorizeRoles(Roles.SUPER_ADMIN);