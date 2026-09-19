import express from "express";

import adminRoutes from "./admin/index.js";
// import superAdminRoutes from "./super-admin/index.js";
import accountRoutes from "./account.route.js";
import addressRoutes from "./address.route.js";


const routes = express.Router();
    
routes.use("/admin", adminRoutes);
// routes.use("/super-admin", superAdminRoutes);
routes.use("/account", accountRoutes)
routes.use("/address", addressRoutes);

export default routes;