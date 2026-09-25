import express from 'express';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { admin } from '../../../middlewares/role.middleware.js';
import { addProductValidator, deleteProductImageValidator, deleteProductValidator, getAllProductsValidator, getProductDetailValidator, updateProductStatusValidator, updateProductValidator } from '../../../validations/product.validator.js';
import validate from '../../../middlewares/validate.middleware.js';
import { addProduct, deleteProduct, deleteProductImage, getAllProducts, getProductDetails, updateProduct, updateProductStatus, uploadProductImages } from '../../../controllers/product.controller.js';
import upload from '../../../middlewares/upload.middleware.js';

const router = express.Router()

router.post("/add", authenticate, admin, validate(addProductValidator), addProduct)
router.patch("/update", authenticate, admin, validate(updateProductValidator), updateProduct)
router.post("/update-status", authenticate, admin, validate(updateProductStatusValidator), updateProductStatus)
router.post("/list", authenticate, admin, validate(getAllProductsValidator), getAllProducts)
router.post("/detail", authenticate, admin, validate(getProductDetailValidator), getProductDetails)
router.delete("/delete", authenticate, admin, validate(deleteProductValidator), deleteProduct)
router.post("/upload-images/:productId", authenticate, admin, upload.array("productImage", 10), uploadProductImages)
router.delete("/delete-image", authenticate, admin, validate(deleteProductImageValidator), deleteProductImage)

export default router;