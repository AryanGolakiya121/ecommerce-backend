import express from "express";

import { authenticate } from "../../../middlewares/auth.middleware.js";
import { admin } from "../../../middlewares/role.middleware.js";
import validate from "../../../middlewares/validate.middleware.js";
import { addCategory, deleteCategory, updateCategory } from "../../../controllers/category.controller.js";
import { addCategoryValidator, deleteCategoryValidator, updateCategoryValidator } from "../../../validations/category.validator.js";

const router = express.Router();

router.post("/add", authenticate, admin, validate(addCategoryValidator), addCategory);
router.patch("/update", authenticate, admin, validate(updateCategoryValidator), updateCategory);
router.delete("/delete", authenticate, admin, validate(deleteCategoryValidator), deleteCategory);

export default router;