import Joi from "joi";
import { ProductStatus } from "../constants/enums.js";

export const addProductValidator = Joi.object({
    name: Joi.string()
        .trim()
        .min(3)
        .max(150)
        .required(),
    slug: Joi.string()
        .trim()
        .lowercase()
        .min(2)
        .max(150)
        .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .required(),
    description: Joi.string()
        .trim()
        .min(10)
        .max(4000)
        .required(),
    price: Joi.number()
        .min(0)
        .required(),
    compareAtPrice: Joi.number()
        .min(0)
        .allow(null)
        .optional(),
    sku: Joi.string()
        .trim()
        .uppercase()
        .min(2)
        .max(100)
        .required(),
    categoryId: Joi.string()
        .required(),
    brand: Joi.string()
        .trim()
        .max(100)
        .allow(null)
        .optional(),
    stock: Joi.number()
        .integer()
        .min(0)
        .required(),
    status: Joi.string()
        .valid(...Object.values(ProductStatus))
        .default(ProductStatus.DRAFT),
     isFeatured: Joi.boolean()
        .default(false)
});

export const updateProductValidator = Joi.object({
    productId: Joi.string()
        .trim()
        .required(),
    name: Joi.string()
        .trim()
        .min(3)
        .max(150),
    slug: Joi.string()
        .trim()
        .lowercase()
        .min(2)
        .max(150)
        .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: Joi.string()
        .trim()
        .min(10)
        .max(4000),
    price: Joi.number()
        .min(0),
    compareAtPrice: Joi.number()
        .min(0)
        .allow(null),
    sku: Joi.string()
        .trim()
        .uppercase()
        .min(2)
        .max(100),
    categoryId: Joi.string(),
    brand: Joi.string()
        .trim()
        .max(100)
        .allow(null),
    stock: Joi.number()
        .integer()
        .min(0),
    status: Joi.string()
        .valid(...Object.values(ProductStatus)),
     isFeatured: Joi.boolean()
        .default(false)
})

export const updateProductStatusValidator = Joi.object({
    productId: Joi.string()
        .trim()
        .required(),
    status: Joi.string()
        .valid(...Object.values(ProductStatus))
        .required()
})

export const deleteProductValidator = Joi.object({
    productId: Joi.string()
        .trim()
        .required()
})

export const getAllProductsValidator = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10),
    search: Joi.string()
        .trim()
        .allow("")
        .optional(),
    categoryId: Joi.string()
        .trim()
        .allow("")
        .optional(),
    sortBy: Joi.string()
        .valid("name", "price", "stock", "createdAt", "updatedAt")
        .default("createdAt")
        .allow(""),
    sortOrder: Joi.string()
        .valid("asc", "desc")
        .default("desc")
        .allow(""),
    status: Joi.string()
        .valid(...Object.values(ProductStatus))
        .optional()
        .allow(""),
    brand: Joi.string()
        .trim()
        .max(100)
        .allow("")
        .optional(),
    isFeatured: Joi.boolean()
        .optional(),
    minPrice: Joi.number()
        .min(0)
        .optional(),
    maxPrice: Joi.number()
        .min(0)
        .when("minPrice", {
            is: Joi.exist(),
            then: Joi.number().min(Joi.ref("minPrice"))
        })
        .optional(),
    inStock: Joi.boolean()
        .optional()
})

export const getProductDetailValidator = Joi.object({
    productId: Joi.string()
        .trim()
        .required()
});

export const deleteProductImageValidator = Joi.object({
    productId: Joi.string()
        .trim()
        .required(),
    imageId: Joi.string()
        .trim()
        .required(),
})