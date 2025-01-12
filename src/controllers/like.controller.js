import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const userId = req?.user?._id;
    if(!videoId){
        throw new ApiError(401, "VideoId is missing");
    }
    if(!userId){
        throw new ApiError(401,"User is not Logged In");
    }
    // check if video is valid
    const videoDetail = await Video.findById(videoId);
    if(!videoDetail){
        throw new ApiError(404,"Video not Found");
    }
    // check if user has already liked the video
    const isLiked = await Like.findOne(
        {
            $and: [
                {
                    video: videoId
                },
                {
                    likedBy: userId
                }
            ]
        }
    );
    if(isLiked){
        await Like.deleteOne(
            {
                $and: [
                    {
                        video: videoId
                    },
                    {
                        likedBy: userId
                    }
                ]
            }
        );
        return res.status(200).json({
            userId,
            videoId,
            message: "Unliked the video"
        });
    }

    // adding new Like
    const likedVideo = await Like.create({
        video: videoId,
        likedBy: userId
    });
    if(!likedVideo){
        throw new ApiError(401,"Something went wrong while liking video");
    }
    return res.status(200).json(new ApiResponse(200,likedVideo));
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}