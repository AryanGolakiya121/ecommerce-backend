import { Queue } from "bullmq";
import bullmqConnection from "../config/bullmq.js";

const emailQueue = new Queue("email", {
    connection: bullmqConnection
})

export default emailQueue;