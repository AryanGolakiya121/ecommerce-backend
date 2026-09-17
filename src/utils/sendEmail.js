import nodemailer from "nodemailer";
import env from "../config/env.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ejs from "ejs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
        user: env.smtpMail,
        pass: env.smtpPassword
    },
    connectionTimeout: 10000, 
    greetingTimeout: 10000,
    socketTimeout: 10000
});

const sendEmail = async(email, subject, templateName, templateData = {} ) => {
    try {

        const templatePath = path.join(__dirname, "../templates", `${templateName}.ejs`)

        const emailTemplate = await ejs.renderFile(templatePath, templateData); 

        await transporter.sendMail({
            from: env.smtpMail,
            to: email,
            subject,
            html: emailTemplate
        });
        console.log(`Email sent successfully to: ${email}`);
    } catch (error) {
        console.log("Email sedning failed:",error);
        throw error;
    }
}

export default sendEmail;