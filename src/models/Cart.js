import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
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

const cartSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true
        },
        items: {
            type: [cartItemSchema],
            default: []
        },

        // Total number of products
        totalItems: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Sum before discount
        subTotal: {
            type: Number,
            default: 0,
            min: 0
        },

        // Discount coming from product/offer level
        itemDiscount: {
            type: Number,
            default: 0,
            min: 0
        },

        // Coupon discount
        couponDiscount: {
            type: Number,
            default: 0,
            min: 0
        },

        // Cart/Order level promotional discount
        offerDiscount: {
            type: Number,
            default: 0,
            min: 0
        },

        // Applied coupon information
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
            min: 0,
        },

        // Final amount customer needs to pay
        grandTotal: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;