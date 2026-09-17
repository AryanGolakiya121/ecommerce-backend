import express from "express";
import { testEmail } from "../../controllers/email.controller.js";

const router = express.Router();

router.post("/email-test", testEmail);

export default router;