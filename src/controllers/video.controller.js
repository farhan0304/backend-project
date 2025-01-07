import mongoose,{isValidObjectId, Mongoose} from "mongoose";
import { Video } from "../models/video.model.js";
import { nanoid } from "nanoid";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import fileUploader from "../utils/cloudinary.js"
import videoUploader from "../utils/videoUpload.js";
import fileDelete from "../utils/DeleteFile.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const options = {
        page,
        limit,
    };
    if(sortBy&&sortType){
        const sortQuery = {};
        sortQuery[sortBy] = sortType;
        options.sort = sortQuery;
    }
    const currentUserId = req?.user?._id;
    if(!currentUserId){
        throw new ApiError(404,"Something went wrong in fetching Current User ID")
    }
    let pipeline = [
        {
            $match: {
                $or: [
                    {
                        isPublished: true
                    },
                    {
                        owner: new mongoose.Types.ObjectId(String(currentUserId))
                    }
                ]
            }
        }
    ];
    if(userId){
        const newPipeline =  {
            $match: {
                owner: new mongoose.Types.ObjectId(String(userId))
            }
        };
        pipeline.push(newPipeline);
    };
    if(query){
        try {
            const queryObject = JSON.parse(query);
            console.log(queryObject);
        } catch (error) {
            throw new ApiError(400,error)
        }
        
    }
    
  
    const result = await Video.aggregatePaginate(pipeline,options);
    
    if(!result){
        throw new ApiError("Result not fetched")
    }
    res.status(200).json(new ApiResponse(200,result.docs)); 
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
    let thumbnailPath = req.file?.path;

    if(!(title || description || thumbnailPath)){
        throw new ApiError(404,"Atleast one field is required to Update Video");
    }

    const videoDoc = await Video.findById(videoId);
    if(!videoDoc){
        throw new ApiError(401,"Video Id is not valid");
    }
    const userID = String(req?.user?._id);
    const ownerId = String(videoDoc.owner);
    if(userID && ownerId !== userID ){
        throw new ApiError(401,"You are not authorized to do this action");
    }

    let newThumbnail=null;
    if(thumbnailPath){
        const thumbnailDetail = await fileUploader(thumbnailPath);
        newThumbnail = thumbnailDetail.url;
    }
    
    const thumbnailUrl = videoDoc?.thumbnail;
    const thumbnailPublicId = thumbnailUrl.match(/upload\/(?:v\d+\/)?([^\.]+)/)[1];

    if(newThumbnail){
        videoDoc.thumbnail = newThumbnail;
        fileDelete(thumbnailPublicId);
    }
    if(title && title!==undefined){
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

    const videoDoc = await Video.findById(videoId);
    if(!videoDoc){
        throw new ApiError(404,"Video not found with the given Video Id");
    }

    const userID = String(req?.user?._id);
    const ownerId = String(videoDoc.owner);
    if(userID && ownerId !== userID ){
        throw new ApiError(401,"You are not authorized to do this action");
    }
    await Video.findByIdAndDelete(videoId);
    const videoUrl = videoDoc?.videoFile;
    const thumbnailUrl = videoDoc?.thumbnail;

    const videoPublicId = videoUrl.match(/upload\/(?:v\d+\/)?([^\.]+)/)[1];
    const thumbnailPublicId = thumbnailUrl.match(/upload\/(?:v\d+\/)?([^\.]+)/)[1];

    if(videoPublicId){
        console.log(videoPublicId);
        fileDelete(videoPublicId,"video");
    }
    if(thumbnailPublicId){
        fileDelete(thumbnailPublicId);
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
    const userID = String(req?.user?._id);
    const ownerId = String(videoDoc.owner);
    if(userID && ownerId !== userID ){
        throw new ApiError(401,"You are not authorized to do this action");
    }
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