import { Worker } from "bullmq";
import sendEmail from "../utils/sendEmail.js";
import bullmqConnection from "../config/bullmq.js";

const emailWorker = new Worker(
    "email",
    async (job) => {
        const { email, subject, templateName, templateData } = job.data;
        await sendEmail(email, subject, templateName, templateData);
    },
    {
        connection: bullmqConnection,
        concurrency: 5, // Can process email upto 5 at a same time
    }
)

emailWorker.on("completed", (job) => {
    console.log(`Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, error) => {
    console.log(`Email job ${job.id} failed:`, error.message);
})

export default emailWorker;