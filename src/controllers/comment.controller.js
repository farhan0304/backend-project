import mongoose,{isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

})

const addComment = asyncHandler(async (req, res) => {
    
    const {videoId} = req.params;
    const {content} = req.body;
    
    if(!content){
        throw new ApiError(401,"Content is Required");
    }
    if(!isValidObjectId(new mongoose.Types.ObjectId(String(videoId)))){
        throw new ApiError(401,"Video Id is not valid");
    }
    const userId = req?.user?._id;
    if(!userId){
        throw new ApiError(401,"Something went wrong in fetching in User Id");
    }

    const video = new mongoose.Types.ObjectId(String(videoId));
    const comment  = await Comment.create({
        content,
        video,
        owner: userId
    });
    if(!comment){
        throw new ApiError(401,"Something went wring in Adding Comment");
    }
    return res.status(201).json(new ApiResponse(201,comment));

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}