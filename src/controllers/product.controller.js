import mongoose from "mongoose";
import { ProductStatus } from "../constants/enums.js";
import Product from "../models/Product.js"
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Category from "../models/Category.js";
import { cloudinary, uploadImgOnCloudinary } from "../utils/cloudinary.js";

export const addProduct = async(req, res, next) => {
    try {
        const {
            name,
            slug,
            description,
            price,
            compareAtPrice,
            sku,
            categoryId,
            brand,
            stock,
            status,
            isFeatured
        } = req.body;

        if(!mongoose.Types.ObjectId.isValid(categoryId)) {
            throw new ApiError(400, "Category id must be a valid id")
        }

        const category = await Category.findById(categoryId)

        if(!category) {
            throw new ApiError(404, "Category not found");
        }

        // only need one matching product
        const product = await Product.findOne({
            $or: [
                { slug },
                { sku },
            ]
        });

        if(product) {
            // Check duplicate slug or sku
            if(product.slug === slug) {
                throw new ApiError(409, "Product with this slug is already exists")
            }
            if(product.sku === sku) {
                throw new ApiError(409, "Product with this SKU is already exists")
            }
        }

        // Compare price validation
        if(compareAtPrice !== null && compareAtPrice !== undefined && compareAtPrice < price) {
            throw new ApiError(400, "Compare at price must be greater than or equal to price")
        }

        const newProduct = await Product.create({
            name,
            slug,
            description,
            price,
            compareAtPrice,
            sku,
            categoryId: category?._id,
            brand,
            stock,
            status,
            isFeatured
        })

        return ApiResponse(res, 201, "Product added successfuly", newProduct);
    } catch (error) {
        console.log("Error while adding new product:",error);
        next(error);
    }
}

export const updateProduct = async(req, res, next) => {
    try {
        const {
            productId,
            name,
            slug,
            description,
            price,
            compareAtPrice,
            sku,
            categoryId,
            brand,
            stock,
            status,
            isFeatured
        } = req.body;

        if(!mongoose.Types.ObjectId.isValid(productId)) {
            throw new ApiError(400, "Product id is not a valid id")
        }

        const hasCategoryId = categoryId !== undefined;
        if(hasCategoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
            throw new ApiError(400, "Category id is not a valid id")
        }

        // Fetch product + validate category existence
        const [product, categoryExists] = await Promise.all([
            Product.findById(productId),
            hasCategoryId ? Category.exists({ _id: categoryId }) : Promise.resolve(true)
        ]);

        if(!product) {
            throw new ApiError(404, "Product not found")
        }
        if(hasCategoryId && !categoryExists) {
            throw new ApiError(404, "Category not found")
        }

        // Combine slug and sku duplicate checks into single query
        const dupConditions = []
        if(slug !== undefined && slug !== product.slug) dupConditions.push({ slug });
        if(sku !== undefined && sku !== product.sku) dupConditions.push({ sku });

        if(dupConditions.length) {
            const duplicate = await Product.findOne({
                _id: { $ne: productId },
                $or: dupConditions
            }).select("sku slug").lean();

            if(duplicate) {
                if(slug !== undefined && duplicate.slug === slug) {
                    throw new ApiError(409, "Product with this slug already exists");
                }
                if(sku !== undefined && duplicate.sku === sku) {
                    throw new ApiError(409, "Product with this SKU already exists");
                }
            }
        }

        // Calculate final price value
        const finalPrice = price !== undefined ? price : product.price;
        const finalCompareAtPrice = compareAtPrice !== undefined ? compareAtPrice : product.compareAtPrice;

        // Compare price validation
        if (finalCompareAtPrice !== null && finalCompareAtPrice !== undefined && finalCompareAtPrice < finalPrice) {
            throw new ApiError(400, "Compare at price must be greater than or equal to price");
        }

        // Update only provided fields
        if (name !== undefined) product.name = name;
        if (slug !== undefined) product.slug = slug;
        if (description !== undefined) product.description = description;
        if (price !== undefined) product.price = price;
        if (compareAtPrice !== undefined) product.compareAtPrice = compareAtPrice;
        if (sku !== undefined) product.sku = sku;
        if (hasCategoryId) product.categoryId = categoryId;
        if (brand !== undefined) product.brand = brand;
        if (stock !== undefined) product.stock = stock;
        if (status !== undefined) product.status = status;
        if (isFeatured !== undefined) product.isFeatured = isFeatured;

        await product.save();

        return ApiResponse(res, 200, "Product Updated successfully", product)
    } catch (error) {
        console.log("Error while updating product:",error);
        next(error);
    }
}

export const updateProductStatus = async(req, res, next) => {
    try {
        const { productId, status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new ApiError(400, "Product id is not a valid id");
        }

        const product = await Product.findById(productId).select("status");


        if(!product) {
            throw new ApiError(404, "Product not found")
        }

        if(product.status === status) {
            throw new ApiError(400, `Product is already ${status}`)
        }

        product.status = status;
        
        await product.save();

        return ApiResponse(res, 200, "Product status changed successfully", null)
    } catch (error) {
        console.log("Error while updating product status:", error);
        next(error);
    }
}

export const getAllProducts = async(req, res, next) => {
    try {
        const {
            page,
            limit,
            sortBy,
            sortOrder,
            search,
            categoryId,
            status,
            brand,
            isFeatured,
            minPrice,
            maxPrice,
            inStock
        } = req.body;

        const filter = {};
        const currentPage = Number(page) || 1;
        const pageSize = Number(limit) || 10;

        const skip = (currentPage - 1) * pageSize;

        if(search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { sku : { $regex: search, $options: "i" } },
                { slug: { $regex: search, $options: "i" } }
            ]
        }

        if (categoryId) {
            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                throw new ApiError(400, "Category id is not a valid id");
            }
            filter.categoryId = categoryId;
        }
        if (status) filter.status = status;
        if (isFeatured !== undefined) filter.isFeatured = isFeatured;

        if (brand) filter.brand = { $regex: `^${brand}$`, $options: "i" }

        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined) filter.price.$gte = minPrice;
            if (maxPrice !== undefined) filter.price.$lte = maxPrice;
        }

        if (inStock === true ) filter.stock = { $gt: 0 }
        if (inStock === false ) filter.stock = { $lte: 0 }

        // Sorting
        const sortField = sortBy || "createdAt";
        const sortDirection = sortOrder === "asc" ? 1 : -1;

        const [products, totalCount] = await Promise.all([
            Product.find(filter)
                .sort({ [sortField]: sortDirection })
                .skip(skip)
                .limit(pageSize)
                .populate("categoryId", "name slug")
                .lean(),
            
            Product.countDocuments(filter)
        ]);

        const data = {
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            currentPage,
            limit: pageSize,
            products
        }

        return ApiResponse(res, 200, "Product fetched successfully", data)
    } catch (error) {
        console.log("Error while fetching products:", error);
        next(error);
    }
}

export const getProductDetails = async(req, res, next) => {
    try {
        const { productId } = req.body;

        // Check productId
        if(!mongoose.Types.ObjectId.isValid(productId)) {
            throw new ApiError(400, "Product id is not a valid id")
        }

        const product = await Product.findById(productId).populate("categoryId", "name slug").select("-__v").lean();

        if(!product) {
            throw new ApiError(404, "Product not found")
        }

        return ApiResponse(res, 200, "Product fetched successfully", product);
    } catch (error) {
        console.log("Error while fetching product detail:",error)
        next(error);
    }
}

export const deleteProduct = async(req, res, next) => {
    try {
        const { productId } = req.body;

        if(!mongoose.Types.ObjectId.isValid(productId)) {
            throw new ApiError(400, "Product id is not a valid id")
        }

        const product = await Product.findByIdAndDelete(productId).lean();

        if(!product) {
            throw new ApiError(404, "Product not found")
        }

        if(product.images && product.images?.length > 0) {
            const result = await Promise.allSettled(
                product.images?.map((image) => cloudinary.uploader.destroy(image.publicId))
            );

            result.forEach((result, index) => {
                if (result.status === "rejected") {
                    console.log(`Failed to delete Cloudinary image (publicId: ${product.images[index].publicId}):`,result.reason)
                }
            })
            
        }
        return ApiResponse(res, 200, "Product deleted successfully", null)
    } catch (error) {
        console.log("Error while fetching deleting product detail:", error);
        next(error);
    }
}

export const uploadProductImages = async(req, res, next) => {
    try {
        const { productId } = req.params;

        if(!productId) {
            throw new ApiError(400, "Product id is required")
        }

        if(!mongoose.Types.ObjectId.isValid(productId)) {
            throw new ApiError(400, "Product id is not a valid id")
        }

        const product = await Product.findById(productId)

        if (!product) {
            throw new ApiError(404, "Product not found");
        }

        const files = req.files; // multer array upload

        if (!files || files.length === 0) {
            throw new ApiError(400, "At least one image is required");
        }

        // Upload all images to cloudinary in parallel
        const uploadResults = await Promise.all(
            files.map((file) => uploadImgOnCloudinary(file.path, "ecommerce/products"))
        );

        // check if any upload failed
        const failedIndex = uploadResults.findIndex((result) => !result);

        if (failedIndex !== -1) {
            throw new ApiError(500, "Failed to upload one or more images to Cloudinary")
        }
        // Build image object for schema
        const newImages = uploadResults.map((result) => ({
            url: result.secure_url,
            publicId: result.public_id
        }));
        product.images.push(...newImages);

        await product.save();

        return ApiResponse(res, 200, "Product images uploaded successfully", product)
    } catch (error) {
        console.log("Error while fetching deleting product detail:", error);
        next(error);
    }
}

export const deleteProductImage = async(req, res, next) => {
    try {
        const { productId, imageId } = req.body;


        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new ApiError(400, "Product id is not a valid id");
        }

        if (!mongoose.Types.ObjectId.isValid(imageId)) {
            throw new ApiError(400, "Image id is not a valid id");
        }

        const product = await Product.findById(productId);

        if (!product) {
            throw new ApiError(404, "Product not found");
        }

        const image = product.images.id(imageId);

        if (!image) {
            throw new ApiError(404, "Image not found");
        }

        // Delete from cloudinary
        try {
            const result = await cloudinary.uploader.destroy(image.publicId);
            console.log(`Product image from Cloudinary delete result for ${image.publicId}:`,result.result);
        } catch (error) {
            console.log(`Failed to delete Cloudinary image (publicId: ${image.publicId}):`, error);
            throw new ApiError(500, "Failed to delete images from Cloudinary")
        }

        // Remove from product images array 
        image.deleteOne();
        await product.save();

        return ApiResponse(res, 200, "Product image deleted sucessfully", product)
    } catch (error) {
        console.log("Error while deleting product image:",error);
        next(error);
    }
}