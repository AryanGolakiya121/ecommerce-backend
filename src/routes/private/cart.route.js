import express from "express";
import { addProductToCart, clearCart, getUserCart, removeItemFromCart, updateCartItem } from "../../controllers/cart.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import { addProductToCartValidator, removeItemFromCartValidator, updateCartValidator } from "../../validations/cart.validator.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { customer } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.post("/add-product", authenticate, customer, validate(addProductToCartValidator), addProductToCart)
router.get("/", authenticate, customer, getUserCart);
router.post("/update-quantity", authenticate, customer, validate(updateCartValidator), updateCartItem)
router.delete("/remove-item", authenticate, customer, validate(removeItemFromCartValidator), removeItemFromCart);
router.delete("/clear", authenticate, customer,clearCart)

export default router;