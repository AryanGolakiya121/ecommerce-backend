import mongoose from "mongoose";
import { ProductStatus } from "../constants/enums.js";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true,
            index: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        price: {
            type: Number,
            required: true,
        },
        compareAtPrice: {
            type: Number,
            default: null,
        },
        sku: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
            index: true
        },
        brand: {
            type: String,
            trim: true,
            default: null
        },
        stock: {
            type: Number,
            required: true,
            default: 0
        },
        images: [
            {
                url: {
                    type: String,
                    required: true
                },
                publicId: {
                    type: String,
                    required: true
                }
            }
        ],
        status: {
            type: String,
            enum: Object.values(ProductStatus),
            default: ProductStatus.DRAFT
        },
        isFeatured: {
            type: Boolean,
            default: false,
            index: true
        }
    },
    {
        timestamps: true
    }
);
const Product = mongoose.model("Product", productSchema);

export default Product;