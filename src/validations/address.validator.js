import Joi from "joi";
import { AddressType } from "../constants/enums.js";

export const addAddressValidator = Joi.object({
    fullName: Joi.string()
        .trim()
        .min(3)
        .max(100)
        .required(),
    phone: Joi.string()
        .trim()
        .length(10)
        .pattern(/^[0-9]+$/)
        .required(),
    email: Joi.string()
        .trim()
        .email()
        .required(),
    addressLine1: Joi.string()
        .trim()
        .max(200)
        .required(),
    addressLine2: Joi.string()
        .trim()
        .max(200)
        .allow(null)
        .optional(),
    city: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required(),
    postalCode: Joi.string()
        .trim()
        .pattern(/^[0-9]{6}$/)
        .required(),
    state: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required(),
    country: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .default("India"),
    landmark: Joi.string()
        .trim()
        .max(100)
        .allow(null)
        .optional(),
    addressType: Joi.string()
        .valid(...Object.values(AddressType))
        .default(AddressType.HOME),
    isDefault: Joi.boolean()
        .default(false)
})

export const updateAddressValidator = Joi.object({
    addressId: Joi.string()
        .trim()
        .required(),
    fullName: Joi.string()
        .trim()
        .min(2)
        .max(100),
    phone: Joi.string()
        .trim()
        .length(10)
        .pattern(/^[0-9]+$/),
    email: Joi.string()
        .trim()
        .email(),
    addressLine1: Joi.string()
        .trim()
        .max(200),
    addressLine2: Joi.string()
        .trim()
        .max(200)
        .allow(null),
    city: Joi.string()
        .trim()
        .min(2)
        .max(100),
    postalCode: Joi.string()
        .trim()
        .pattern(/^[0-9]{6}$/),
    state: Joi.string()
        .trim()
        .min(2)
        .max(100),
    country: Joi.string()
        .trim()
        .min(2)
        .max(100),
    landmark: Joi.string()
        .trim()
        .max(100)
        .allow(null),
    addressType: Joi.string()
        .valid(...Object.values(AddressType)),
    isDefault: Joi.boolean()
})