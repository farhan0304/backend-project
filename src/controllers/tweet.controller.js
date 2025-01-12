import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    
    const { content } = req.body;
        
    if(!content){
        throw new ApiError(401,"Content is Required");
    }

    const userId = req?.user?._id;
    if(!userId){
        throw new ApiError(401,"Something went wrong in fetching in User Id");
    }

    const tweet  = await Tweet.create({
        content,
        owner: userId
    });
    if(!tweet){
        throw new ApiError(400,"Something went wring in Adding Comment");
    }
    return res.status(201).json(new ApiResponse(201,tweet));
})

const getUserTweets = asyncHandler(async (req, res) => {
    
    const {userId} = req.params;
    
    
    if(!userId){
        throw new ApiError(401,"Something went wrong in fetching User Id");
    }

    const tweetDocs = await Tweet.find({
        owner: userId
    });

    if(!tweetDocs){
        throw new ApiError(400,"No tweets present");
    }

    return res.status(200).json(new ApiResponse(200,tweetDocs));
})

const updateTweet = asyncHandler(async (req, res) => {
    
    const {tweetId} = req.params;
    const {content} = req.body;

    if(!tweetId){
        throw new ApiError(401,"Tweet Id is required");
    }

    if(!content){
        throw new ApiError(401,"Content is required to Edit the tweet");
    }

    const tweet = new mongoose.Types.ObjectId(String(tweetId));
    if(!isValidObjectId(tweet)){
        throw new ApiError(401,"Tweet Id is not valid MongoDb Id");
    }
    const userId = req?.user?._id;

    if(!userId){
        throw new ApiError(401,"Something went wrong in fetching in User Id");
    }
    const tweetDoc = await Tweet.findById(tweet);
    if(!tweetDoc){
        throw new ApiError(404,"Tweet Id is not valid");
    }
    const userIdString = String(userId);
    const ownerString = String(tweetDoc.owner);
    if(userIdString !== ownerString){
        throw new ApiError(401,"You are not Authorized to edit tweet");
    }

    tweetDoc.content = content;
    tweetDoc.save();

    return res.status(200).json(new ApiResponse(200,tweetDoc));

})

const deleteTweet = asyncHandler(async (req, res) => {
    
    const {tweetId} = req.params;

    if(!tweetId){
        throw new ApiError(401,"Tweet Id is required");
    }

    const tweet = new mongoose.Types.ObjectId(String(tweetId));
    if(!isValidObjectId(tweet)){
        throw new ApiError(401,"Tweet Id is not valid MongoDb Id");
    }
    const userId = req?.user?._id;
    if(!userId){
        throw new ApiError(401,"Something went wrong in fetching in User Id");
    }
    const tweetDoc = await Tweet.findById(tweet);

    if(!tweetDoc){
        throw new ApiError(404,"Tweet Id is not valid");
    }

    if(String(tweetDoc.owner) !== String(userId)){
        throw new ApiError(401,"You are not Authorized to edit tweet");
    }

    await Tweet.findByIdAndDelete(tweet);

    return res.status(200).json(new ApiResponse(200,tweetDoc));    
    
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}