import mongoose,{isValidObjectId, Mongoose} from "mongoose";
import { Video } from "../models/video.model.js";
import {User} from "../models/user.model.js"
import { nanoid } from "nanoid";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import fileUploader from "../utils/cloudinary.js"
import videoUploader from "../utils/videoUpload.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if(!title || !description){
        throw new ApiError(401,"Title and Description both are required");
    }
    const videoPath = req.files?.videoFile[0]?.path;
    const thumbnailPath = req.files?.thumbnail[0]?.path;
    if(!videoPath){
        throw new ApiError(401,"Video is Required");
    }
    if(!thumbnailPath){
        throw new ApiError(401,"Thumbnail is Required");
    }
    const userId = req.user._id;
    const uuid = nanoid(10);
    
    const videoDetail = await videoUploader(videoPath,uuid);
    
    const thumbnailDetail = await fileUploader(thumbnailPath);
    if(!thumbnailDetail){
        throw new ApiError(404,"Thumbnail not uploaded on CLoudinary");
    }
    const videoDoc = await Video.create({
        videoFile: "Video is uploading in background",
        thumbnail: thumbnailDetail.url,
        title,
        description,
        duration: 1,
        uuid,
        owner: userId
    })
    if(!videoDoc){
        throw new ApiError(404,"Video not uploaded in Database");
    }
    

    return res.status(200).json(new ApiResponse(200,videoDoc));

})

const uploadVideoFromCloudinary = asyncHandler(async (req, res) => {
    const videoFile = req.body?.url;
    if(!videoFile){
        throw new ApiError(402,"Video Url not present")
    }
    const videoId = req.body.context?.custom?.userid;
    if(!videoId){
        throw new ApiError(400,"Something wrong in userid");
    }
    const duration = req.body?.duration || 1;

    const videoDoc = await Video.findOneAndUpdate(
        {
            uuid: videoId
        }
        ,{
        $set:{
            videoFile,duration
        }
    });
    // console.log(videoDoc);

    return res.status(200).json(new ApiResponse(200,{message: "Video Uploaded Successfully on Cloudinary"}));
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(401,"Video Id is missing");
    }
    if(!isValidObjectId(new mongoose.Types.ObjectId(String(videoId)))){
        throw new ApiError(401,"Video Id is not valid");
    }
    const videoDoc = await Video.findById(videoId);
    return res.status(200).json(new ApiResponse(200,videoDoc));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    let title = req.body?.title;
    let description = req.body?.description;
    let thumbnailPath = req.file?.thumbnail[0]?.path;

    if(!(title || description || thumbnailPath)){
        throw new ApiError(404,"Atleast one field is required to Update Video");
    }
    let newThumbnail=null;
    if(thumbnailPath){
        const thumbnailDetail = await fileUploader(thumbnailPath);
        newThumbnail = thumbnailDetail.url;
    }
    const videoDoc = await Video.findById(videoId);
    if(!videoDoc){
        throw new ApiError(401,"Video Id is not valid");
    }
    if(newThumbnail){
        videoDoc.thumbnail = newThumbnail;
    }
    if(title){
        videoDoc.title = title;
    }
    if(description){
        videoDoc.description = description;
    }
    videoDoc.save().then(doc=>{
        return res.status(201).json(new ApiResponse(201,videoDoc));
        
    }).catch(err=>{
        throw new ApiError(401,"Something went wrong in changing Published status");
    });

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(401,"Video Id is missing");
    }
    if(!isValidObjectId(new mongoose.Types.ObjectId(String(videoId)))){
        throw new ApiError(401,"Video Id is not valid");
    }
    const videoDoc = await Video.findByIdAndDelete(videoId);
    if(!videoDoc){
        throw new ApiError(404,"Video not found with the given Video Id");
    }

    return res.status(200).json(new ApiResponse(200,videoDoc));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(401,"Video Id is missing");
    }
    if(!isValidObjectId(new mongoose.Types.ObjectId(String(videoId)))){
        throw new ApiError(401,"Video Id is not valid");
    }
    const videoDoc = await Video.findById(videoId);
    const publishStatus = videoDoc.isPublished;
    videoDoc.isPublished = !publishStatus;
    videoDoc.save().then(doc=>{
        return res.status(201).json(new ApiResponse(201,videoDoc));
        
    }).catch(err=>{
        throw new ApiError(401,"Something went wrong in changing Published status");
    });
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    uploadVideoFromCloudinary
}