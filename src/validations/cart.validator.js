import Joi from "joi";

export const addProductToCartValidator = Joi.object({
    productId: Joi.string()
        .trim()
        .required(),
    quantity: Joi.number()
        .integer()
        .min(1)
        .required()
})

export const updateCartValidator = Joi.object({
    productId: Joi.string().trim().required(),
    quantity: Joi.number().integer().min(1).required()
});

export const removeItemFromCartValidator = Joi.object({
    productId: Joi.string().trim().required(),
})