import express from "express";
import authRoutes from "./auth.routes.js";
import emailTestRoutes from "./email-test.route.js"

const routes = express.Router();
routes.use("/auth", authRoutes)
routes.use(emailTestRoutes);

export default routes;