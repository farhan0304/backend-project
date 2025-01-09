import mongoose,{isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    
    const {videoId} = req.params;
    const {page = 1, limit = 10} = req.query;
    if(!videoId){
        throw new ApiError(401,"Video Id is required");
    }
    const pipeline = [
        {
            $match:{
                video: new mongoose.Types.ObjectId(String(videoId))
            }
        }
    ];
    const options = {
        page,
        limit
    };
    const paginationresult = await Comment.aggregatePaginate(pipeline,options);
    if(!paginationresult){
        throw new ApiError(400,"Something went wrong in getting Video Comments");
    }
    return res.status(200).json(new ApiResponse(200,paginationresult.docs));

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
    
    const {commentId} = req.params;
    const {content} = req.body;

    if(!commentId){
        throw new ApiError(401,"Comment Id is required");
    }
    if(!content){
        throw new ApiError(401,"Content is required to Edit the comment");
    }

    const comment = new mongoose.Types.ObjectId(String(commentId));
    if(!isValidObjectId(comment)){
        throw new ApiError(401,"Comment Id is not valid MongoDb Id");
    }
    const userId = req?.user?._id;
    if(!userId){
        throw new ApiError(401,"Something went wrong in fetching in User Id");
    }
    const commentDoc = await Comment.findById(comment);
    if(!commentDoc){
        throw new ApiError(404,"Comment Id is not valid");
    }
    if(commentDoc.owner !== userId){
        throw new ApiError(401,"You are not Authorized to edit comment");
    }

    commentDoc.content = content;
    commentDoc.save();

    return res.status(201,new ApiResponse(201,commentDoc));

})

const deleteComment = asyncHandler(async (req, res) => {
    
    const {commentId} = req.body;
    if(!commentId){
        throw new ApiError(401,"Comment Id is required");
    }
    const comment = new mongoose.Types.ObjectId(String(commentId));
    if(!isValidObjectId(comment)){
        throw new ApiError(401,"Comment Id is not valid MongoDb Id");
    }
    const userId = req?.user?._id;
    if(!userId){
        throw new ApiError(401,"Something went wrong in fetching in User Id");
    }
    const commentDoc = await Comment.findById(comment);
    if(!commentDoc){
        throw new ApiError(404,"Comment Id is not valid");
    }
    if(commentDoc.owner !== userId){
        throw new ApiError(401,"You are not Authorized to edit comment");
    }
    await Comment.findByIdAndDelete(comment);

    return res.status(200).json(new ApiResponse(200,commentDoc));

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}