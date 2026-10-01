import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Order from "../models/Order.js";
import { OrderStatus, PaymentMethod, PaymentStatus } from "../constants/enums.js";
import Product from "../models/Product.js";


export const getAllOrders = async(req, res, next) => {
    try {
        const {
            page,
            limit,
            orderStatus,
            paymentStatus,
            paymentMethod,
            orderNumber,
            sortBy,
            sortOrder,
        } = req.body;

        const currentPage = Number(page) || 1;
        const pageSize = Number(limit) || 10;

        const skip = (page - 1) * limit;

        const filter = {};
        
        if (orderStatus) filter.orderStatus = orderStatus;
        if (paymentStatus) filter.paymentStatus = paymentStatus;
        if (paymentMethod) filter.paymentMethod = paymentMethod;

        if (orderNumber) {
            filter.orderNumber = { $regex: orderNumber, $options: "i" }
        }

        // const sortField = sortBy || "createdAt";
        // const sortDirection = sortOrder === "asc" ? 1 : -1;

        const [orders, totalOrders] = await Promise.all([
            Order.find(filter)
                .select("-__v -updatedAt -coupon")
                // .sort({ [sortField]: sortDirection })
                .skip(skip)
                .limit(pageSize)
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

        return ApiResponse(res, 200, "Orders fetched successfully", data);

    } catch (error) {
        console.log("Error while fetching all orders:",error);
        next(error);
    }
}

export const getOrderDetail = async(req, res, next) => {
    try {
        const { orderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            throw new ApiError(400, "Order id is not a valid id");
        }

        const order = await Order.findById(orderId).lean();

        if (!order) {
            throw new ApiError(404, "Order not found");
        }

        return ApiResponse(res, 200, "Order detail fetched successfully", order);

    } catch (error) {
        console.log("Error while fetching order details:",error);
        next(error);
    }
}

export const updateOrderStatus = async(req, res, next) => {
    try {
        const { orderId, status, note } = req.body;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            throw new ApiError(400, "Order id is not a valid id");
        }

        const order = await Order.findById(orderId);

        if (!order) {
            throw new ApiError(404, "Order not found");
        }

        const currentStatus = order.orderStatus;

        if (currentStatus === status) {
            throw new ApiError(400, `Order is already ${status}`);
        }

        // Prevent status changes on terminal states
        const terminalStatuses = [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.RETURNED];

        if (terminalStatuses.includes(currentStatus)) {
            throw new ApiError(400, `Cannot change status of an order that is already ${currentStatus}`);
        }
        // order.orderStatus = status;

        // Side effects for specific status transitions
        // if (status === OrderStatus.DELIVERED) {
        //     order.deliveredAt = new Date();
        //     // COD orders are paid on delivery
        //     if (order.paymentMethod === PaymentMethod.COD) {
        //         order.paymentStatus = PaymentStatus.PAID;
        //         // await Payment.findOneAndUpdate(
        //         //     { orderId: order._id },
        //         //     { status: PaymentStatus.PAID, paidAt: new Date() }
        //         // );
        //     }
        //     order.orderStatus = OrderStatus.DELIVERED;
        // }

        if (status === OrderStatus.CANCELLED) {

            const cancellableStatuses = [
                OrderStatus.PENDING,
                OrderStatus.CONFIRMED,
                OrderStatus.PROCESSING
            ];
             if (!cancellableStatuses.includes(currentStatus)) {
                throw new ApiError(400, `Order cannot be cancelled when status is ${currentStatus}`);
            }
            // Restock items since order is cancelled
            await Promise.all(
                order.items.map((item) => Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } }) )
            )
            order.orderStatus = OrderStatus.CANCELLED;
            order.cancelledAt = new Date();
            order.cancelReason = note || "Cancelled by admin";


            // If payment was already made, mark for refund
            if (order.paymentStatus === PaymentStatus.PAID) {
                order.paymentStatus = PaymentStatus.REFUNDED;
                
                // await Payment.findOneAndUpdate(
                //     { orderId: order._id },
                //     { status: PaymentStatus.REFUNDED, refundedAt: new Date(), refundedAmount: order.grandTotal }
                // );
            }
        } 

        // Normal status flow

        if (status !== OrderStatus.CANCELLED) {

            const orderStatusFlow = [
                OrderStatus.PENDING,
                OrderStatus.CONFIRMED,
                OrderStatus.PROCESSING,
                OrderStatus.SHIPPED,
                OrderStatus.DELIVERED
            ];
            // Normal status flow
            const currentIndex = orderStatusFlow.indexOf(currentStatus);
            const newIndex = orderStatusFlow.indexOf(status);

            if (currentIndex === -1 || newIndex === -1) {
                throw new ApiError(400, "Invalid order status transition");
            }

            // Only allow next status
            if (newIndex !== currentIndex + 1) {
                throw new ApiError(400, `Cannot change order status from ${currentStatus} to ${status}`);
            }
            order.orderStatus = status;

            if (status === OrderStatus.DELIVERED) {

                order.deliveredAt = new Date();

                // COD orders are paid on delivery
                if (order.paymentMethod === PaymentMethod.COD) {
                    order.paymentStatus = PaymentStatus.PAID;
                    // await Payment.findOneAndUpdate(
                    //     { orderId: order._id },
                    //     { status: PaymentStatus.PAID, paidAt: new Date() }
                    // );
                }
                // order.orderStatus = OrderStatus.DELIVERED;
            }
        }
        

        await order.save();

        return ApiResponse(res, 200, "Order status updated successfully", order);

    } catch (error) {
        console.log("Error while updating order status:",error);
        next(error);
    }
}