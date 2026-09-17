import sendEmail from "../utils/sendEmail.js";
import ApiResponse from "../utils/ApiResponse.js";

export const testEmail = async(req, res, next) => {
    try {
        const { email } = req.body;
        const emailHtml = `
            <h2>Email Test Successful</h2>
            <p>This email was sent from your E-commerce API.</p>
            <p>Nodemailer SMTP configuration is working correctly.</p>
        `
        await sendEmail(
            email,
            "E-commerce API Test Email",
            emailHtml 
        );
        return ApiResponse(res, 200, "Test email sent successfully")
    } catch (error) {
        console.log("Error while sending test email:",error);
        next(error);
    }
}