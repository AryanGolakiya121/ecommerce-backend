import { v2 as cloudinary } from "cloudinary";
import env from "../config/env.js"
import fs from "node:fs";

cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret
})

export const uploadImgOnCloudinary = async(localFilePath, folder) => {
    try {
        if(!localFilePath) {
            console.log("Could not find the path");
            return null;
        }
        
        // Upload file to the cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            unique_filename: false,
            use_filename: true,
            resource_type: "image",
            folder: folder,
        })
        
        // Remove temporary local file after successful upload
        await fs.promises.unlink(localFilePath);

        console.log("File has been uploaded on cloudinary successfully")
        
        return response;
    } catch (error) {
        // Remove temporary file if its exists
        if(localFilePath && fs.existsSync(localFilePath)) {
            await fs.promises.unlink(localFilePath)
        }
        console.log("Error uploading avatar image to cloudinary:",error)
        return null;
    }
}

export { cloudinary }