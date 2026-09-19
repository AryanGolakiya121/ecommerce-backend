import express from "express";
import { getAllCategory, getCategoryById } from "../../controllers/category.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import { getCategoryByIdValidator } from "../../validations/category.validator.js";

const router = express.Router();

router.get("/list", getAllCategory);
router.post("/single", validate(getCategoryByIdValidator) ,getCategoryById);


export default router;