import {v2 as cloudinary} from "cloudinary";
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const videoUploader = async (localFilePath,userId="1") =>{
    try {
        if (!localFilePath) return null;
        const uploadResult = await cloudinary.uploader
        .upload_large(
            localFilePath, {
                resource_type:"video",
                context: `userid=${userId}`,
                chunk_size: 6000000,
                eager_async: true,
                notification_url: "https://71e8-103-95-83-219.ngrok-free.app/cloudinary-webhook"
            }
        )
        console.log("File is uploaded in cloudinary: ",uploadResult.url);
        fs.unlinkSync(localFilePath);
        return uploadResult;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export default videoUploader;