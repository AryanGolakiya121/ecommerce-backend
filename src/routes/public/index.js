import express from "express";
import authRoutes from "./auth.routes.js";
import emailTestRoutes from "./email-test.route.js"
import categoryRoutes from "./category.route.js";

const routes = express.Router();
routes.use("/auth", authRoutes)
routes.use("/category", categoryRoutes);
routes.use(emailTestRoutes);

export default routes;