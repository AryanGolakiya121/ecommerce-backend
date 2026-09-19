import mongoose from "mongoose";
import { AddressType } from "../constants/enums.js";


const addressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true
        },
        addressLine1: {
            type: String,
            trim: true,
        },
        addressLine2: {
            type: String,
            trim: true,
            default: null
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        postalCode: {
            type: String,
            required: true,
            trim: true
        },
        state: {
            type: String,
            required: true,
            trim: true
        },
        country: {
            type: String,
            required: true,
            trim: true
        },
        landmark: {
            type: String,
            required: true,
            trim: true,
            default: null
        },
        addressType: {
            type: String,
            enum: Object.values(AddressType),
            default: AddressType.HOME,
        },
        isDefault: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true
    }
);

const Address = mongoose.model("Address", addressSchema);

export default Address;