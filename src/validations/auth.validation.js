import Joi from "joi";
import { Roles } from "../constants/enums.js";

export const registerValidator = Joi.object({
    firstName: Joi.string()
        .required()
        .trim()
        .min(3)
        .max(30),
    lastName: Joi.string()
        .required()
        .trim()
        .min(3)
        .max(30),
    userName: Joi.string()
        .required()
        .trim()
        .lowercase()
        .min(3)
        .max(30)
        .pattern(/^[a-z0-9_]+$/),
    email: Joi.string()
        .required()
        .trim()
        .email()
        .lowercase(),
    password: Joi.string()
        .required()
        .trim()
        .min(8)
        .max(30),
    // role: Joi.string()
    //     .valid(Roles.ADMIN, Roles.SUPER_ADMIN, Roles.CUSTOMER)
    //     .default(Roles.CUSTOMER),
    phone: Joi.string()
        .trim()
        .length(10)
        .pattern(/^[0-9]+$/)
        .allow("")
        .optional()
})

export const loginValidator = Joi.object({
    input: Joi.string()
        .trim()
        .required(),
    password: Joi.string()
        .required()
})

export const refreshTokenValidator = Joi.object({
    refreshToken: Joi.string().required()
})


export const forgotPasswordValidator = Joi.object({
    email: Joi.string()
        .required()
        .trim()
        .email()  
})

export const resetPasswordValidator = Joi.object({
    token: Joi.string()
        .trim()
        .required(),
    newPassword: Joi.string()
        .min(8)
        .max(30)
        .trim()
        .required(),
    confirmPassword: Joi.string()
        .required()
        .valid(Joi.ref("newPassword"))
        .messages({"any.only": "Confirm password must match with new password"})
})

export const resendVerificationEmailValidator = Joi.object({
    email: Joi.string().trim().lowercase().email().required()
})