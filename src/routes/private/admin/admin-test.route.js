import express from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { admin } from "../../../middlewares/role.middleware.js";

const router = express.Router();

router.get("/admin-test", authenticate, admin, (req, res) => {
    res.status(200).json({
            success: true,
            message: "Admin access granted",
            data: {
                userId: req.user._id,
                role: req.user.role
            }
        });
})

export default router;