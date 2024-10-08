import {v2 as cloudinary} from "cloudinary";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const fileDelete = async (publicId,fileType="image") =>{
    try {
        if (!publicId) return null;
        const deleteResult = await cloudinary.uploader
        .destroy(
            publicId,{
                resource_type: fileType
            }
            
        )
        console.log("File is Deleted in cloudinary: ",deleteResult);
        return deleteResult;
    } catch (error) {
        console.log("Error while deleting the File")
        return null;
    }
}

export default fileDelete;