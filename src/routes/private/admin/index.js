import express from "express";
import adminTestRoutes from "./admin-test.route.js";
import categoryRoutes from "./category.route.js";
import productRoutes from "./product.route.js";
import orderRoutes from "./order.route.js";

const routes = express.Router();

routes.use(adminTestRoutes);
routes.use("/categories", categoryRoutes);
routes.use("/product", productRoutes);
routes.use("/order", orderRoutes);

export default routes;