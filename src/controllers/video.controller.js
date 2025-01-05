import mongoose,{isValidObjectId} from "mongoose";
import { Video } from "../models/video.model.js";
import {User} from "../models/user.model.js"
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
    const videoDetail = await videoUploader(videoPath);
    const userId = req.user._id;
    
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
        owner: userId
    })
    if(!videoDoc){
        throw new ApiError(404,"Video not uploaded in Database");
    }


    return res.status(200).json(new ApiResponse(200,videoDoc));

})

const uploadVideoFromCloudinary = asyncHandler(async (req, res) => {

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
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