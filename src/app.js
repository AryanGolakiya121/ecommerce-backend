import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import env from "./config/env.js";
import requestId from "./middlewares/requestId.middleware.js";
import globalRateLimiter from "./middlewares/rateLimit.middleware.js";
import notFound from "./middlewares/notFound.middleware.js";
import errorHandler from "./middlewares/error.middleware.js";
import Joi from "joi";
import mongoose from "mongoose";
import { publicRoutes, privateRoutes } from "./routes/index.js";

const app = express();

app.disable("x-powered-by");

app.use(requestId);

//Security header
app.use(helmet());

//cors
app.use(
    cors({
        origin: env.clientUrl,
        credentials: true,
    })
)

// request logging
app.use(morgan("dev"));

// cookie parser
app.use(cookieParser());

app.use(globalRateLimiter)

// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API Running successfully"
    })
})

app.use("/api/public", publicRoutes)
app.use("/api/private", privateRoutes);
app.use(notFound)
app.use(errorHandler)

export default app;