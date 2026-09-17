import express from "express";
import adminTestRoutes from "./admin-test.route.js";

const routes = express.Router();

routes.use(adminTestRoutes);

export default routes;