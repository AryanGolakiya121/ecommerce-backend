import express from "express";
import { changePassword, deleteAvatarImage, getMyProfile, updateMyProfile, uploadAvatarImage } from "../../controllers/account.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { changePasswordValidator, updateProfileValidator } from "../../validations/account.validator.js";
import upload from "../../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/profile", authenticate, getMyProfile);
router.put("/change-password", authenticate, validate(changePasswordValidator), changePassword);
router.patch("/update-profile", authenticate, validate(updateProfileValidator), updateMyProfile);
router.post("/profile/upload-avatar", authenticate, upload.single("avatar"), uploadAvatarImage);
router.delete("/profile/avatar", authenticate, deleteAvatarImage);

export default router;