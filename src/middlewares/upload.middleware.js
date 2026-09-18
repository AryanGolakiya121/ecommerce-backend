import multer from "multer";
import fs from "node:fs";
import path from "node:path";


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), "uploads", "temp");

        if(!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const currentDate = new Date();
        const randomNumber = Math.floor(100000 + Math.random() * 900000) // Generate six digits random number
        const day = currentDate.getDate().toString().padStart(2, '0'); // Get day with leading zero if needed
        const month = (currentDate.getMonth() + 1).toString().padStart(2, "0"); // Get month with leading zero if needed
        const year = currentDate.getFullYear().toString();

        const date = `${day}${month}${year}`;
        
        const fileName = `${date}_${randomNumber}_${file.originalname}`

        cb(null, fileName)
    }
});

const fileFilter = (req, file, cb) => {
    const alloweTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if(alloweTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error("Only JPG, PNG and WEBP images are allowed"));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits : { 
        fileSize: 5 * 1024 * 1024 // Max 5MB files are allowed
    }
});

export default upload;