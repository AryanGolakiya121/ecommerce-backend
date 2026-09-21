import express from "express";

import { authenticate } from "../../../middlewares/auth.middleware.js";
import { admin } from "../../../middlewares/role.middleware.js";
import validate from "../../../middlewares/validate.middleware.js";
import { addCategory, deleteCategory, deleteCategoryImage, updateCategory, uploadCategoryImage } from "../../../controllers/category.controller.js";
import { addCategoryValidator, deleteCategoryValidator, updateCategoryValidator } from "../../../validations/category.validator.js";
import upload from "../../../middlewares/upload.middleware.js";

const router = express.Router();

router.post("/add", authenticate, admin, validate(addCategoryValidator), addCategory);
router.patch("/update", authenticate, admin, validate(updateCategoryValidator), updateCategory);
router.delete("/delete", authenticate, admin, validate(deleteCategoryValidator), deleteCategory);
router.post("/upload-image/:categoryId", authenticate, admin, upload.single("categoryImage"), uploadCategoryImage);
router.delete("/delete-image", authenticate, admin, validate(deleteCategoryValidator), deleteCategoryImage);

export default router;