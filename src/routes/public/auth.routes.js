import express from "express";

import { loginUser, registerUser, refreshToken, logoutUser, forgotPassword, resetPassword, verifyEmail, resendVerificationEmail } from "../../controllers/auth.controller.js";
import { loginValidator, registerValidator, forgotPasswordValidator, resetPasswordValidator, resendVerificationEmailValidator } from "../../validations/auth.validation.js";
import validate from "../../middlewares/validate.middleware.js";

const router = express.Router()

router.post("/register", validate(registerValidator), registerUser);
router.post("/login", validate(loginValidator), loginUser);
router.post("/refresh-token", refreshToken);
router.post("/logout", logoutUser);

router.post("/forgot-password", validate(forgotPasswordValidator), forgotPassword);
router.post("/reset-password", validate(resetPasswordValidator), resetPassword);
router.get("/verify-email", verifyEmail);
router.post("/resend-email-verification", validate(resendVerificationEmailValidator), resendVerificationEmail)


export default router;