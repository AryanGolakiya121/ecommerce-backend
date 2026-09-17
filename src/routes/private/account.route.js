import express from "express";
import { changePassword, getMyProfile, updateMyProfile } from "../../controllers/account.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { changePasswordValidator, updateProfileValidator } from "../../validations/account.validator.js";

const router = express.Router();

router.get("/profile", authenticate, getMyProfile);
router.put("/change-password", authenticate, validate(changePasswordValidator), changePassword);
router.patch("/update-profile", authenticate, validate(updateProfileValidator), updateMyProfile);

export default router;