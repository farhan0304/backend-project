import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"
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
    const userId = req?.user?._id;
    if(!commentId){
        throw new ApiError(401, "Comment Id is missing");
    }

    if(!userId){
        throw new ApiError(401,"User is not Logged In");
    }

    // check if Comment is valid
    const commentDetail = await Comment.findById(commentId);
    if(!commentDetail){
        throw new ApiError(404,"Comment not Found");
    }

    // check if user has already liked the comment
    const isLiked = await Like.findOne(
        {
            $and: [
                {
                    comment: commentId
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
                        comment: commentId
                    },
                    {
                        likedBy: userId
                    }
                ]
            }
        );
        return res.status(200).json({
            userId,
            commentId,
            message: "Unliked the comment"
        });
    }

    // adding new Like
    const likedComment = await Like.create({
        comment: commentId,
        likedBy: userId
    });

    if(!likedComment){
        throw new ApiError(401,"Something went wrong while liking comment");
    }

    return res.status(200).json(new ApiResponse(200,likedComment));

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const userId = req?.user?._id;
    if(!tweetId){
        throw new ApiError(401, "Tweet Id is missing");
    }

    if(!userId){
        throw new ApiError(401,"User is not Logged In");
    }

    // check if Tweet is valid
    const tweetDetail = await Tweet.findById(tweetId);
    if(!tweetDetail){
        throw new ApiError(404,"Tweet not Found");
    }

    // check if user has already liked the tweet
    const isLiked = await Like.findOne(
        {
            $and: [
                {
                    tweet: tweetId
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
                        tweet: tweetId
                    },
                    {
                        likedBy: userId
                    }
                ]
            }
        );
        return res.status(200).json({
            userId,
            tweetId,
            message: "Unliked the comment"
        });
    }

    // adding new Like
    const likedTweet = await Like.create({
        tweet: tweetId,
        likedBy: userId
    });

    if(!likedTweet){
        throw new ApiError(401,"Something went wrong while liking tweet");
    }

    return res.status(200).json(new ApiResponse(200,likedTweet));

})

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req?.user?._id;
    if(!userId){
        throw new ApiError(400,"User is not logged in");
    }
    return res.status(200).json(new ApiResponse(200,{message:"ok"}));
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}