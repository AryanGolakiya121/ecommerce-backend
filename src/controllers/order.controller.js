import mongoose from "mongoose";
import Order from "../models/Order.js";
import Address from "../models/Address.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { OrderStatus, PaymentMethod, PaymentStatus, ProductStatus } from "../constants/enums.js";
import { generateOrderNumber, recalculateCartTotals } from "../utils/helper.js";
import { addEmailJob } from "../queues/email.jobs.js";

export const placeOrder = async(req, res, next) => {
    // const session = await mongoose.startSession();
    try {
        // session.startTransaction()
        const userId = req.user._id;
        const { addressId, paymentMethod } = req.body;

        // 1. Validate address ID
        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            throw new ApiError(400, "Address id is not a valid id");
        }

        // 2. Check address belongs to logged in user
        // const address = await Address.findOne({ _id: addressId, userId }).session(session);
        const address = await Address.findOne({ _id: addressId, userId });

        if(!address) {
            throw new ApiError(404, "Address not found");
        }

        // 3. Get cart
        const cart = await Cart.findOne( { userId })//.session(session);

        if (!cart || cart.items.length === 0) {
            throw new ApiError(400, "Cart is empty");
        }

        // 4. Get all products
        const productIds = cart.items.map((item) => item.productId);

        // const products = await Product.find({ _id: { $in: productIds }}).session(session);
        const products = await Product.find({ _id: { $in: productIds }})

        const orderItems = [];
        let totalItems = 0;
        let subTotal = 0;
        let itemDiscount = 0;

        // 5. Validate products and calculate totals
        for (const cartItems of cart.items) {
            const product = products.find((item) => item._id.toString() === cartItems.productId.toString());

            if (!product) {
                throw new ApiError(400, "One or more products in cart are no longer available")
            }

            if (product.status !== ProductStatus.ACTIVE) {
                throw new ApiError(400, `${product.name} is not available`)
            }

            if (product.stock < cartItems.quantity) {
                throw new ApiError(400, `Only ${product.stock} unit(s) available for ${product.name}`);
            }

            const unitPrice = product.price;
            const discountPerUnit = product.compareAtPrice && product.compareAtPrice > product.price ? product.compareAtPrice - product.price : 0
            const discount = discountPerUnit * cartItems.quantity;
            const finalPrice = unitPrice * cartItems.quantity;

            totalItems += cartItems.quantity;
            subTotal += finalPrice;
            itemDiscount += discount;

            orderItems.push({
                productId: product._id,
                productName: product.name,
                productImage: product.images?.[0]?.url || null,
                quantity: cartItems.quantity,
                unitPrice,
                discount,
                finalPrice
            });
        }

        // 6. Calculate totals
        const couponDiscount = cart.couponDiscount || 0;
        const offerDiscount = cart.offerDiscount || 0;
        const shippingCharge = cart.shippingCharge || 0;
        const taxAmount = cart.taxAmount || 0;

        const grandTotal = subTotal - couponDiscount - offerDiscount + shippingCharge + taxAmount;

        // 7. Generate order number
        const orderNumber = generateOrderNumber();

        // 8. Order/Payment status
        let orderStatus = OrderStatus.PENDING;
        let paymentStatus = PaymentStatus.PENDING;

        if (paymentMethod === PaymentMethod.COD) {
            orderStatus = OrderStatus.CONFIRMED;
            paymentStatus = PaymentStatus.PENDING;
        }

        // 9. Stored shipping address and coupon data
        const shippingAddressData = {
            phone: address.phone,
            fullName: address.fullName,
            addressLine1: address.addressLine1,
            email: address.email,
            city: address.city,
            addressLine2: address.addressLine2,
            state: address.state,
            postalCode: address.postalCode,
            landmark: address.landmark,
            country: address.country,
            addressType: address.addressType
        }

        const couponData = {
            couponId: cart.coupon?.couponId || null,
            code: cart.coupon?.code || null
        }

        // 10. Create order
        // const [order] = await Order.create(
        //     [
        //         {
        //             orderNumber,
        //             userId,

        //             items: orderItems,

        //             shippingAddress: shippingAddressData,

        //             totalItems,
        //             subTotal,
        //             itemDiscount,

        //             couponDiscount,
        //             offerDiscount,

        //             coupon: couponData,

        //             shippingCharge,
        //             taxAmount,
        //             grandTotal,

        //             orderStatus,
        //             paymentStatus,
        //             paymentMethod
        //         }
        //     ],
        //     { session }
        // );
        const order = await Order.create({
            orderNumber,
            userId,

            items: orderItems,

            shippingAddress: shippingAddressData,

            totalItems,
            subTotal,
            itemDiscount,

            couponDiscount,
            offerDiscount,

            coupon: couponData,

            shippingCharge,
            taxAmount,
            grandTotal,

            orderStatus,
            paymentStatus,
            paymentMethod
        })

        // 11. Reduce stock
        for (const cartItem of cart.items) {
            const updateProduct = await Product.findOneAndUpdate(
                {
                    _id: cartItem.productId,
                    stock: { $gte: cartItem.quantity }
                },
                {
                    $inc: {
                        stock: -cartItem.quantity
                    }
                },
                {
                    new: true,
                    // session
                }
            );

            if (!updateProduct) {
                throw new ApiError(400, "Stock changed while placing the order. Please try again.");
            }
        }

        // 12. Clear cart
        cart.items = [];
        cart.coupon = { couponId: null, code: null };
        cart.couponDiscount = 0;
        cart.offerDiscount = 0;
        cart.shippingCharge = 0;
        cart.taxAmount = 0;

        recalculateCartTotals(cart);
        
        // await cart.save({ session });
        await cart.save();

        // await session.commitTransaction();

        // 13. Send email

        const emailTemplateData = {
            customerName: order.shippingAddress.fullName,

            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            totalItems: order.totalItems,

            items: order.items,

            subTotal: order.subTotal,
            itemDiscount: order.itemDiscount,
            couponDiscount: order.couponDiscount,
            offerDiscount: order.offerDiscount,
            shippingCharge: order.shippingCharge,
            taxAmount: order.taxAmount,
            grandTotal: order.grandTotal,

            shippingAddress: order.shippingAddress
        }
        await addEmailJob({
            email: order.shippingAddress.email,
            subject: `Order Placed Successfully - ${order.orderNumber}`,
            templateName: "order-placed",
            templateData: emailTemplateData
        })

        return ApiResponse(res, 201, "Order placed successfully", order);

    } catch (error) {
        // await session.abortTransaction();
        console.log("Error while placing new order:",error);
        next(error);
    }  
    // finally {
    //     session.endSession();
    // }
}

export const getMyOrders = async (req, res, next) => {
    try {
        const { page, limit, status } = req.body;

        const currentPage = Number(page) || 1;
        const pageSize = Number(limit) || 10;

        const skip = (page - 1) * limit;
        const userId = req.user._id;

        const filter = { userId };

        if (status) filter.orderStatus = status;

        const [orders, totalOrders] = await Promise.all([
            Order.find(filter)
                .select("orderNumber items totalItems subTotal grandTotal orderStatus paymentStatus paymentMethod createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            Order.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalOrders / pageSize);

        const data = {
            totalOrders,
            totalPages,
            currentPage,
            limit: pageSize,
            orders
        }

        return ApiResponse(res, 200,  "Orders fetched successfully", data);
    } catch (error) {
        console.log("Error while fetching orders:",error);
        next(error);
    }
}

export const getOrderDetail = async(req, res, next) => {
    try {
        const { orderId } = req.body;
        const userId = req.user._id;

        console.log("userId:",userId);

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            throw new ApiError(400, "Order id is not a valid id");
        }

        const order = await Order.findOne({ _id: orderId, userId }).select("-__v");
       
        if (!order) {
            throw new ApiError(404, "Order not exists");
        }
        return ApiResponse(res, 200, "Order details fetched successfully", order);
    } catch (error) {
        console.log("Error while fetching order details:",error);
        next(error);
    }
}

export const cancelOrder = async(req, res, next) => {
    try {
        const { orderId, reason } = req.body;

        const userId =  req.user._id;

        if(!mongoose.Types.ObjectId.isValid(orderId)) {
            throw new ApiError(400, "Order id is not a valid id");
        }
        const order = await Order.findOne({ _id: orderId, userId })

        if (!order) {
            throw new ApiError(404, "Order not found");
        }

        const cancellableStatuses = [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING
        ]

        if (!cancellableStatuses.includes(order.orderStatus)) {
            throw new ApiError(400, `Order cannot be cancelled when status is ${order.orderStatus}`)
        }

        // Restore product stock
        for (const item of order.items) {
            const product = await Product.findById(item.productId);

            if (product) {
                product.stock += item.quantity;
                await product.save()
            }
        }
        order.orderStatus = OrderStatus.CANCELLED;
        order.cancelledAt = new Date();
        order.cancelReason = reason;

        await order.save();

        const templateData = {
            customerName: order.shippingAddress.fullName,
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            grandTotal: order.grandTotal,
            cancelledAt: order.cancelledAt.toLocaleString("en-IN"),
            cancelReason: order.cancelReason
        }

        await addEmailJob({
            email: order.shippingAddress.email,
            subject: `Order Cancelled - ${order.orderNumber}`,
            templateName: "order-cancelled",
            templateData
        })

        const data = {
            orderId: order._id,
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            cancelledAt: order.cancelledAt,
            cancelReason: order.cancelReason
        }

        return ApiResponse(res, 200, "Order cancelled successfully", data)
    } catch (error) {
        console.log("Error while canceling order:",error);
        next(error);
    }
}

export const trackOrder = async(req, res, next) => {
    try {
        const { orderId } = req.body;

        const userId =  req.user._id;

        if(!mongoose.Types.ObjectId.isValid(orderId)) {
            throw new ApiError(400, "Order id is not a valid id");
        }
        const order = await Order.findOne({ _id: orderId, userId }).select("orderNumber orderStatus paymentStatus paymentMethod createdAt").lean();

        if (!order) {
            throw new ApiError(404, "Order not found");
        }

        const statusFlow = [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED
        ];
        
        const currentStatusIndex = statusFlow.indexOf(order.orderStatus);

        const tracking = statusFlow.map((status, index) => ({
            status,
            completed: currentStatusIndex >= index
        }));

        const data = {
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt,
            tracking
        }

        return ApiResponse(res, 200, "Order trackking fetched successfully", data)
    } catch (error) {
        console.log("Error while canceling order:",error);
        next(error);
    }
}