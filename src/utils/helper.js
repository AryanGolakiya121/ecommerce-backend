import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import crypto from "node:crypto";

export const encrypt = async(password) => {
    return await bcrypt.hash(password, 12)
}

export const comparePassword = async(plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword)
}

export const generateAccessToken = (payload) => {
    return jwt.sign(
        payload,
        env.jwt.accessSecret,
        {
            expiresIn: env.jwt.accessExpiresIn
        }
    )
}

export const generateRefreshToken = (payload) => {
    return jwt.sign(
        payload,
        env.jwt.refreshSecret,
        {
            expiresIn: env.jwt.refreshExpiresIn
        }
    )
}

export const verifyAccessToken = (token) => {
    return jwt.verify(token, env.jwt.accessSecret)
}

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, env.jwt.refreshSecret)
}

export const hashToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex")
}

export const generateToken = () => {
    return crypto.randomBytes(32).toString("hex")
}

export const recalculateCartTotals = (cart) => {
    let totalItems = 0;
    let subTotal = 0;
    let itemDiscount = 0;

    cart.items.forEach((item) => {
        totalItems += item.quantity;
        subTotal += item.unitPrice * item.quantity;
        itemDiscount += item.discount; // Kept for display (like "you saved ₹X total")
    });

    cart.totalItems = totalItems;
    cart.subTotal = subTotal;
    cart.itemDiscount = itemDiscount;

    cart.grandTotal = 
        subTotal - 
        cart.couponDiscount -   // actual discount (coupon applied at checkout) 
        cart.offerDiscount +    // actual discount (cart/order-level offer)
        cart.shippingCharge + 
        cart.taxAmount;

    return cart;
}

export const generateOrderNumber = () => {
    const currentDate = new Date();
    const day = currentDate.getDate().toString().padStart(2, '0'); // get day with leading zero if needed
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // get month with leading zero if needed
    const year = currentDate.getFullYear().toString(); 
    const dateStr = `${year}${month}${day}`;

    const random = Math.floor(100000 + Math.random() * 900000);  // generate six digits random number
    return `ORD-${dateStr}-${random}`
}