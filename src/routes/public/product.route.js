import express from "express";
import { getCustomerFeaturedProductValidator, getCustomerProductListValidator, getProductDetailValidator } from "../../validations/product.validator.js";
import validate from "../../middlewares/validate.middleware.js";
import { getFeaturedProductsForCustomer, getProductDetailforCustomer, getProductForCustomer } from "../../controllers/product.controller.js";

const router = express.Router();

router.post("/list", validate(getCustomerProductListValidator), getProductForCustomer);
router.post("/detail", validate(getProductDetailValidator), getProductDetailforCustomer);
router.post("/featured", validate(getCustomerFeaturedProductValidator), getFeaturedProductsForCustomer);

export default router;