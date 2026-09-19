import Joi from "joi";
import { CategoryStatus } from "../constants/enums.js";
import mongoose from "mongoose";

export const addCategoryValidator = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required(),
    slug: Joi.string()
        .trim()
        .lowercase()
        .min(2)
        .max(100)
        .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .required(),
    description: Joi.string()
        .trim()
        .max(500)
        .allow(null)
        .optional(),
    status: Joi.string()
        .valid(CategoryStatus.ACTIVE, CategoryStatus.INACTIVE)
        .default(CategoryStatus.ACTIVE)
});

export const updateCategoryValidator = Joi.object({
    categoryId: Joi.string()
        .trim()
        .required(),
    name: Joi.string()
        .trim()
        .min(2)
        .max(100),
    slug: Joi.string()
        .trim()
        .lowercase()
        .min(2)
        .max(100)
        .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: Joi.string()
        .trim()
        .max(500)
        .allow(null),
    status: Joi.string()
        .valid(CategoryStatus.ACTIVE, CategoryStatus.INACTIVE)
})

export const deleteCategoryValidator = Joi.object({
    categoryId: Joi.string()
        .trim()
        .required(),
})

export const getCategoryByIdValidator = Joi.object({
    categoryId: Joi.string()
        .trim()
        .required(),
})