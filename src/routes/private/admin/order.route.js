import express from "express";
import { getAllOrders, getOrderDetail, updateOrderStatus } from "../../../controllers/admin.controller.js";
import { getOrderDetailValidator, getOrdersValidator, updateOrderStatusValidator } from "../../../validations/admin.validator.js";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { admin } from "../../../middlewares/role.middleware.js";
import validate from "../../../middlewares/validate.middleware.js";

const router = express.Router();

router.post("/list", authenticate, admin, validate(getOrdersValidator), getAllOrders);
router.get("/detail/:orderId", authenticate, admin, getOrderDetail);
router.post("/update-status", authenticate, admin, validate(updateOrderStatusValidator), updateOrderStatus)

export default router;