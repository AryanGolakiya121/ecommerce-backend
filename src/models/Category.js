import mongoose from "mongoose";
import { CategoryStatus } from "../constants/enums.js";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        slug: {
            type: String,
            required: true, 
            unique: true,
            trim: true,
            lowercase: true,
            index: true
        },
        description: {
            type: String,
            trim: true,
            default: null,
        },
        image: {
            url: {
                type: String,
                default: null,
            },
            publicId: {
                type: String,
                default: null,
            }
        },
        status: {
            type: String,
            enum: Object.values(CategoryStatus)
        }
    },
    {
        timestamps: true
    }
);

const Category = mongoose.model("Category", categorySchema);

export default Category;