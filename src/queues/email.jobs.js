import emailQueue from "./email.queue.js";

const emailJobOptions = {
    attempts: 3, 
    backoff : {
        type: "exponential",
        delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
};

export const addEmailJob = async ({ email, subject, templateName, templateData }) => {
    return emailQueue.add(
        templateName,
        {
            email,
            subject,
            templateName,
            templateData
        },
        {
            attempts:3, // BullMQ can process the same job up to 3 times
            backoff: {
                type: "exponential",
                delay: 2000,    // 2 second
            },
            removeOnComplete: true,
            removeOnFail: false
        }
    )
}