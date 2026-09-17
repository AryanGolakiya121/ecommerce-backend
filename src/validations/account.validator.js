import Joi from "joi";


export const changePasswordValidator = Joi.object({
    currentPassword: Joi.string()
        .required(),
    newPassword: Joi.string()
        .required()
        .trim()
        .min(8)
        .max(30)
        .not(Joi.ref("currentPassword"))
        .messages({ "any.invalid": "New password must be different from current password"}),
    confirmPassword: Joi.string()
        .required()
        .valid(Joi.ref("newPassword"))
        .messages({"any.only": "Confirm password must match new password"})
})

export const updateProfileValidator = Joi.object({
    firstName: Joi.string()
        .trim()
        .min(3)
        .max(30),
    lastName: Joi.string()
        .trim()
        .min(3)
        .max(30),
    phone: Joi.string()
        .trim()
        .length(10)
        .pattern(/^[0-9]+$/)
        .allow("")
})//.min(1) // At least one field must be provided