import mongoose from "mongoose";
import Category from "../models/Category.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const addCategory = async(req, res, next) => {
    try {
        const { name, slug, description, status } = req.body;

        const existingCategory = await Category.findOne({
            $or: [
                { name },
                { slug }
            ]
        });

        if(existingCategory) {
            throw new ApiError(404, "Category name or slud already exists")
        }

        const category = await Category.create({
            name,
            slug,
            description,
            status
        })

        return ApiResponse(res, 201, "Category added successfully", category)
    } catch (error) {
        console.log("Error while adding category:",error)
        next(error);
    }
}

export const updateCategory = async(req, res, next) => {
    try {
        const { categoryId, name, slug, description, status } = req.body;

        // if(!categoryId) {
        //     throw new ApiError(404, "Category id is required");
        // }
        if(!mongoose.Types.ObjectId.isValid(categoryId)) {
            throw new ApiError(400, "Category id is not valid");
        }

        const category = await Category.findById(categoryId);

        if(!category) {
            throw new ApiError(404, "Category not found")
        }

        // Check duplicate name or slug
        const duplicateConditions = [];

        if (name !== undefined && name !== category.name) {
            duplicateConditions.push({ name });
        }

        if (slug !== undefined && slug !== category.slug) {
            duplicateConditions.push({ slug });
        }

        if (duplicateConditions.length > 0) {
            const result = await Category.findOne({
                $or: duplicateConditions,
                _id: { $ne: categoryId }
            });

            if (result) {
                throw new ApiError(409,"Category with same name or same slug already exists");
            }
        }
        // if( (name !== undefined && name !== category.name) || (slug !== undefined && slug !== category.slug) ) {
        //     const result = await Category.findOne({
        //         $or: [
        //             { name },
        //             { slug }
        //         ],
        //         _id: { $ne: categoryId }
        //     })
        //     if (result) {
        //         throw new ApiError(404, "Category with same name or same slug already exists");
        //     }
        // }
        if(name !== undefined) {
            category.name = name;
        }
        if(slug !== undefined) {
            category.slug = slug;
        }
        if (description !== undefined) {
            category.description = description;
        }

        if (status !== undefined) {
            category.status = status;
        }

        await category.save();

        return ApiResponse(res, 200, "Category updated successfully", category);
    } catch (error) {
        console.log("Error while updating category:",error);
        next(error);
    }
}

export const getAllCategory = async(req, res, next) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        return ApiResponse(res, 200, "Categories fetched successfully", categories);
    } catch (error) {
        console.log("Error in getAllcategories:",error);
        next(error);
    }
}

export const getCategoryById = async(req, res, next) => {
    try {
        const { categoryId } = req.body;

        if(!categoryId) {
            throw new ApiError(404, "Category id is required");
        }
        if(!mongoose.Types.ObjectId.isValid(categoryId)) {
            throw new ApiError(400, "Category id is not valid");
        }

        const category = await Category.findById(categoryId).select("-__v");

        if(!category) {
            throw new ApiError(404, "Category not found");
        }
        
        return ApiResponse(res, 200, "Category fetched successfully", category);
    } catch (error) {
        console.log("Error while getCategoryById:",error);
        next(error);
    }
}

export const deleteCategory = async(req, res, next) => {
    try {
        const { categoryId } = req.body;

        if (!categoryId) {
            throw new ApiError(400, "Category id is required");
        }

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            throw new ApiError(400, "Category id is not valid");
        }
        const category = await Category.findByIdAndDelete(categoryId);

        if(!category) {
            throw new ApiError(404, "Category not found");
        }

        return ApiResponse(res, 200, "Category deleted successfully", null)
    } catch (error) {
        console.log("Error while deleting category:",error);
        next(error);
    }
}