import { ProductStatus } from "../constants/enums.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { recalculateCartTotals } from "../utils/helper.js";



export const addProductToCart = async(req, res, next) => {
    try {
        const userId = req.user._id;
        const { productId, quantity } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new ApiError(400, "Product id is not a valid id");
        }

        // Find product
        const product = await Product.findById(productId);

        if (!product) {
            throw new ApiError(404, "Product not found");
        }

        // Check product status
        if (product.status !== ProductStatus.ACTIVE) {
            throw new ApiError(400, "Product is not available");
        }

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            // Create cart if it doesn't exist
            cart = new Cart({ userId, items: [] });
        }

        const existingItem = cart.items.find(
            (item) => item.productId.toString() === productId
        );

        const requestedQuantity = existingItem ? existingItem.quantity + quantity : quantity;

        if (product?.stock < requestedQuantity) {
            throw new ApiError(400, `Only ${product.stock} unit(s) available in stock`);
        }

        const unitPrice = product.price;
        const discountPerUnit = product.compareAtPrice && product.compareAtPrice > product.price ? product.compareAtPrice - product.price : 0;

        if (existingItem) {
            existingItem.quantity = requestedQuantity;
            existingItem.unitPrice = unitPrice;
            existingItem.discount = discountPerUnit * existingItem.quantity;
            existingItem.finalPrice = unitPrice * existingItem.quantity // No discount subtraction
        } else {
            const discount = discountPerUnit * quantity;
            const finalPrice = unitPrice * quantity ; // No discount subtraction

            cart.items.push({
                productId,
                quantity,
                unitPrice,
                discount,
                finalPrice
            })
        }

        recalculateCartTotals(cart);

        await cart.save();

        return ApiResponse(res, 200, "Product added to cart successfully", cart);
    } catch (error) {
        console.log("Error while addng product to cart:",error)
        next(error);
    }
}

export const getUserCart = async(req, res, next) => {
    try {
        const userId = req.user._id;

        const checkCart = await Cart.aggregate([
            {
                $match: { userId: new mongoose.Types.ObjectId(userId) }
            },
            // convert cart items array into separate documents
            {
                $unwind: {
                    path: "$items",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "items.product"
                }
            },
            // Convert product array into object
            {
                $unwind: {
                    path: "$items.product",
                    preserveNullAndEmptyArrays: true
                }
            },
            // Remove cart items whose product no longer exits
            {
                $match: {
                    $or: [
                        { "items.product": { $ne: null } },
                        { items: { $exists: false } }
                    ]
                }
            },
            // Build cart back
            {
                $group: {
                    _id: "$_id",
                    userId: { $first: "$userId" },
                    items: {
                        $push: {
                            _id: "$items._id",
                            productId: "$items.product._id",
                            name: "$items.product.name",
                            slug: "$items.product.slug",
                            image: {
                                $arrayElemAt: ["$items.product.images.url", 0]
                            },
                            stock: "$items.product.stock",
                            status: "$items.product.status",
                            // Current product pricing
                            currentPrice: "$items.product.price",
                            currentCompareAtPrice: "$items.product.compareAtPrice",
                            // Cart snapshot
                            quantity: "$items.quantity",
                            unitPrice: "$items.unitPrice",
                            discount: "$items.discount",
                            finalPrice: "$items.finalPrice"
                        }
                    },
                    totalItems: { $first: "$totalItems" },
                    subTotal: { $first: "$subTotal" },
                    itemDiscount: { $first: "$itemDiscount" },
                    couponDiscount: { $first: "$couponDiscount" },
                    offerDiscount: { $first: "$offerDiscount" },
                    coupon: { $first: "$coupon" },
                    shippingCharge: { $first: "$shippingCharge" },
                    taxAmount: { $first: "$taxAmount" },
                    grandTotal: { $first: "$grandTotal" },
                    createdAt: { $first: "$createdAt" },
                    updatedAt: { $first: "$updatedAt" },
                }
            },
            // 7. Return only required fields
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    items: 1,
                    totalItems: 1,
                    subTotal: 1,
                    itemDiscount: 1,
                    couponDiscount: 1,
                    offerDiscount: 1,
                    coupon: 1,
                    shippingCharge: 1,
                    taxAmount: 1,
                    grandTotal: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ])

        const cart = checkCart[0] || {
            userId,
            items: [],
            totalItems: 0,
            subTotal: 0,
            itemDiscount: 0,
            couponDiscount: 0,
            offerDiscount: 0,
            coupon: {
                couponId: null,
                code: null
            },
            shippingCharge: 0,
            taxAmount: 0,
            grandTotal: 0
        }

        return ApiResponse(res, 200, "Cart fetched successfully", cart)
        
    } catch (error) {
        console.log("Error while fetching user cart:",error);
        next(error);
    }
}

export const updateCartItem = async(req, res, next) => {
    try {
        const userId = req.user._id;
        const { productId, quantity } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new ApiError(400, "Product id is not a valid id");
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            throw new ApiError(404, "Cart not found");
        }

        const cartItem = cart.items.find((item) => item.productId.toString() === productId);
        
        if (!cartItem) {
            throw new ApiError(404, "Product not found in cart");
        }
        // Find product
        const product = await Product.findById(productId);

        if (!product) {
            throw new ApiError(404, "Product not found");
        }

        // Check product status
        if (product.status !== ProductStatus.ACTIVE) {
            throw new ApiError(400, "Product is not available");
        }

        if (product.stock < quantity) {
            throw new ApiError(400, `Only ${product.stock} unit(s) available in stock`);
        }

        const unitPrice = product.price;
        const discountPerUnit = 
            product.compareAtPrice && product.compareAtPrice > product.price
                ? product.compareAtPrice - product.price
                : 0;
          
        const discount = discountPerUnit * quantity;
        const finalPrice = unitPrice * quantity;
        // Update cart item
        cartItem.quantity = quantity;
        cartItem.unitPrice = unitPrice;
        cartItem.discount = discount;
        cartItem.finalPrice = finalPrice;

        recalculateCartTotals(cart);

        await cart.save();

        return ApiResponse(res, 200, "Cart item quantity updated successfully", cart);
    } catch (error) {
        console.log("Error while updating cart:",error);
        next(error);
    }
}

export const removeItemFromCart = async(req, res, next) => {
    try {
        const { productId } = req.body;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new ApiError(400, "Product id is not a valid id");
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            throw new ApiError(404, "Cart not found");
        }

        const cartItem = cart.items.find((item) => item.productId.toString() === productId);

        if (!cartItem) {
            throw new ApiError(404, "Product not found in cart");
        }

        cartItem.deleteOne();

        recalculateCartTotals(cart);

        await cart.save();

        return ApiResponse(res, 200, "Product removed from cart successfully", cart);
    } catch (error) {
        console.log("Error while removing items from cart:",error);
        next(error);
    }
}

export const clearCart = async(req, res, next) => {
    try {
        const userId = req.user._id;
        const cart = await Cart.findOne({ userId });

        if(!cart) {
            throw new ApiError(404, "Cart not found");
        }

        cart.items = [];
        cart.coupon = { couponId: null, code: null };
        cart.couponDiscount = 0;
        cart.offerDiscount = 0;
        cart.shippingCharge = 0;
        cart.taxAmount = 0;

        recalculateCartTotals(cart);
        
        await cart.save();

        return ApiResponse(res, 200, "Cart cleared successfully", cart);
    } catch (error) {
        console.log("Error while clearing cart:", error);
        next(error);
    }
}