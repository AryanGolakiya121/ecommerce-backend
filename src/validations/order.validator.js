import Joi from "joi";
import { OrderStatus, PaymentMethod } from "../constants/enums.js";

export const placeOrderValidator = Joi.object({
    addressId: Joi.string()
        .trim()
        .required(),
    paymentMethod: Joi.string()
        .valid(...Object.values(PaymentMethod))
        .required()
})

export const getMyOrdersValidator = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(50)
        .default(10),
    status: Joi.string()
        .valid(...Object.values(OrderStatus))
        .optional()
        .allow(""),
});

export const getOrderDetailsValidator = Joi.object({
    orderId: Joi.string()
        .trim()
        .required()
})

export const cancelOrderValidator = Joi.object({
    orderId: Joi.string()
        .trim()
        .required(),
    
    reason: Joi.string()
        .trim()
        .min(3)
        .max(300)
        .required()
})
export const trackOrderValidator = Joi.object({
    orderId: Joi.string()
        .trim()
        .required(),
});