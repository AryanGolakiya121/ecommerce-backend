import dotenv from "dotenv";
import Joi from "joi";
dotenv.config();

const envSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid("development", "test", "production")
        .default("development"),
    PORT: Joi.number()
        .integer()
        .min(1)
        .max(65535)
        .default(4000),
    MONGO_URI: Joi.string().required(),
    JWT_ACCESS_SECRET: Joi.string().required(),
    JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
    JWT_REFRESH_SECRET: Joi.string().required(),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),
    COOKIE_SECURE: Joi.boolean().truthy("true").falsy("false").default(false),
    CLIENT_URL: Joi.string().default("http://localhost:3000"),
    CLOUDINARY_CLOUD_NAME: Joi.string().allow("").default(""),
    CLOUDINARY_API_KEY: Joi.string().allow("").default(""),
    CLOUDINARY_API_SECRET: Joi.string().allow("").default(""),
    STRIPE_SECRET_KEY: Joi.string().allow("").default(""),
    STRIPE_WEBHOOK_SECRET: Joi.string().allow("").default(""),
    SMTP_HOST: Joi.string().allow("").optional(),
    SMTP_PORT: Joi.number().default(587),
    SMTP_SECURE: Joi.boolean().default(false),
    SMTP_MAIL: Joi.string().email().allow("").optional(),
    SMTP_PASSWORD: Joi.string().allow("").optional(),
    REDIS_URL: Joi.string().required(),
}).unknown(true)


const { error, value } = envSchema.validate(process.env, { abortEarly: false, convert: true });

if(error){
    console.log("Environment validation failed:")
    error.details.forEach((detail) => {
        console.log(`- ${detail.message}`);
    });
    process.exit(1)
}

const env = {
    nodeEnv: value.NODE_ENV || "development",
    port: value.PORT,
    mongoUri: value.MONGO_URI,

    jwt: {
        accessSecret: value.JWT_ACCESS_SECRET,
        accessExpiresIn: value.JWT_ACCESS_EXPIRES_IN || "15m",

        refreshSecret: value.JWT_REFRESH_SECRET,
        refreshExpiresIn: value.JWT_REFRESH_EXPIRES_IN || "7d"
    },
    cookie: {
        secure: value.COOKIE_SECURE
    },
    clientUrl: value.CLIENT_URL || "http://localhost:3000",
    smtpHost: value.SMTP_HOST,
    smtpPort: value.SMTP_PORT,
    smtpSecure: value.SMTP_SECURE,
    smtpMail: value.SMTP_MAIL,
    smtpPassword: value.SMTP_PASSWORD,
    redisUrl: value.REDIS_URL,
}

export default env;