import Joi from "joi";
import { OrderStatus, PaymentMethod, PaymentStatus } from "../constants/enums.js";

export const getOrdersValidator = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    // sortBy: Joi.string()
    //     .valid("")
    //     .default("createdAt")
    //     .allow(""),
    // sortOrder: Joi.string()
    //     .valid("asc", "desc")
    //     .default("desc")
    //     .allow(""),
    orderStatus: Joi.string()
        .valid(...Object.values(OrderStatus))
        .optional()
        .allow(""),
    paymentStatus: Joi.string()
        .valid(...Object.values(PaymentStatus))
        .optional()
        .allow(""),
    paymentMethod: Joi.string()
        .valid(...Object.values(PaymentMethod))
        .optional()
        .allow(""),
    orderNumber: Joi.string().trim().max(100).allow("").optional(),
});

export const getOrderDetailValidator = Joi.object({
    orderId: Joi.string()
        .trim()
        .required()
})

export const updateOrderStatusValidator = Joi.object({
    orderId: Joi.string()
        .trim()
        .required(),
    status: Joi.string()
        .valid(...Object.values(OrderStatus))
        .required(),
    note: Joi.when("status", {
        is: OrderStatus.CANCELLED,
        then: Joi.string().trim().min(3).max(300).required(),
        otherwise: Joi.any().default(null).allow(null)
    })
});