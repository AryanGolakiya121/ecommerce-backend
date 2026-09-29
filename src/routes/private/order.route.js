import express from "express";
import { cancelOrder, getMyOrders, getOrderDetail, placeOrder, trackOrder } from "../../controllers/order.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import { cancelOrderValidator, getMyOrdersValidator, getOrderDetailsValidator, placeOrderValidator, trackOrderValidator } from "../../validations/order.validator.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { customer } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.post("/place", authenticate, customer, validate(placeOrderValidator), placeOrder);
router.post("/my-orders", authenticate, customer, validate(getMyOrdersValidator), getMyOrders);
router.post("/detail", authenticate, customer, validate(getOrderDetailsValidator), getOrderDetail);
router.post("/cancel", authenticate, customer, validate(cancelOrderValidator), cancelOrder);
router.post("/trackking", authenticate, customer, validate(trackOrderValidator), trackOrder);

export default router;