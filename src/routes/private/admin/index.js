import express from "express";
import adminTestRoutes from "./admin-test.route.js";
import categoryRoutes from "./category.route.js";

const routes = express.Router();

routes.use(adminTestRoutes);
routes.use("/categories", categoryRoutes);

export default routes;