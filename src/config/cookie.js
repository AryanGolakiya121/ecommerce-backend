import env from "./env.js";

export const refreshTokenCookieOptions = {
    httpOnly: true, // JavaScript cannot access cookie
    secure: env.nodeEnv === "production",   // Cookie sent only over HTTPS in production
    sameSite: "lax",    // Helps protect against CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000     // Cookie expires after 7 days
}