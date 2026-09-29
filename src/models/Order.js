import mongoose from "mongoose";
import { AddressType, OrderStatus, PaymentMethod, PaymentStatus } from "../constants/enums.js";

const orderItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        productName: {
            type: String,
            required: true,
            trim: true  
        },
        productImage: {
            type: String,
            default: null
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },
        discount: {
            type: Number,
            default: 0,
            min: 0
        },
        finalPrice: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        _id: true
    }
);

const shippingAddressSchema = new mongoose.Schema(
    {
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
            required: true,
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
            trim: true,
            default: null
        },
        addressType: {
            type: String,
            enum: Object.values(AddressType),
            default: AddressType.HOME,
        },
    },
)
const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: (items) => items.length > 0,
                message: "Order must contain at least one item"
            }
        },
        shippingAddress: {
            type: shippingAddressSchema,
            required: true
        },
        totalItems: {
            type: Number,
            required: true,
            min: 1
        },
        subTotal: {
            type: Number,
            required: true,
            min: 0
        },
        itemDiscount: {
            type: Number,
            default: 0,
            min: 0
        },
        couponDiscount: {
            type: Number,
            default: 0,
            min: 0
        },
        offerDiscount: {
            type: Number,
            default: 0,
            min: 0
        },
        coupon: {
            couponId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Coupon",
                default: null
            },
            code: {
                type: String,
                default: null,
                trim: true,
                uppercase: true
            }
        },
        shippingCharge: {
            type: Number,
            default: 0,
            min: 0
        },
        taxAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        grandTotal: {
            type: Number,
            required: true,
            min: 0
        },

        // 
        orderStatus: {
            type: String,
            enum: Object.values(OrderStatus),
            default: OrderStatus.PENDING,
            index: true
        },
        paymentStatus: {
            type: String,
            enum: Object.values(PaymentStatus),
            default: PaymentStatus.PENDING,
            index: true
        },
        paymentMethod: {
            type: String,
            enum: Object.values(PaymentMethod),
            required: true
        },
        cancelledAt: { 
            type: Date, 
            default: null 
        },
        cancelReason: { 
            type: String, 
            trim: true, 
            default: null 
        },
        deliveredAt: { 
            type: Date, 
            default: null 
        }
    },
    {
        timestamps: true
    }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;