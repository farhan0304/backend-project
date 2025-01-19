import mongoose, {isValidObjectId, Mongoose} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if(!name || !description){
        throw new ApiError(401,"All fields are required")
    }
    const owner = req?.user?._id;
    const playlist = await Playlist.create({
        name,description,owner
    });
    if(!playlist){
        throw new ApiError(400,"Something went wrong in creating Playlist");
    }
    return res.status(201).json(new ApiResponse(201,playlist));
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!userId){
        throw new ApiError(401,"User Id is missing")
    }
    const owner = new mongoose.Types.ObjectId(String(userId));
    if(!isValidObjectId(owner)){
        throw new ApiError(400,"User Id is not valid");
    }
    const playlists = await Playlist.find({
        owner
    });
    if(!playlists){
        throw new ApiError(400,"Something went wrong in fetching Playlist");
    }
    return res.status(200).json(new ApiResponse(200,playlists));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!playlistId){
        throw new ApiError(400,"Playlist Id is missing")
    }
    const playlist = await Playlist.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(String(playlistId))
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $match:{
                            isPublished: true
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                videos: {
                    $first: '$videos'
                }
            }
        }
    ]);
    if(!playlist){
        throw new ApiError(404,"No playlist found with the given Id")
    }
    return res.status(200).json(new ApiResponse(200,playlist));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId || !videoId){
        throw new ApiError(400,"All fields are required")
    }
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(400,"Video not found with the given Video Id");
    }
    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404,"No Playlist found with given Playlist Id")
    }

    const userId = String(req?.user?._id);
    if(userId !== String(playlist.owner)){
        throw new ApiError(401,"You are not authorized to add videos to this Playlist")
    }

    playlist.video.push(videoId);
    playlist.save();

    return res.status(200).json(new ApiResponse(200,playlist));

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    if(!playlistId || !videoId){
        throw new ApiError(400,"All fields are required")
    }
    const videoDoc = await Video.findById(videoId);
    if(!videoDoc){
        throw new ApiError(400,"Video not found with the given Video Id");
    }
    
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(400,"No Playlist found with the given Playlist Id");
    }

    const userId = String(req?.user?._id);
    if(userId !== String(playlist.owner)){
        throw new ApiError(401,"You are not authorized to delete videos from this Playlist")
    }

    playlist.videos.filter(video => video !== videoId );
    playlist.save();

    return res.status(200).json(new ApiResponse(200,playlist));

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if(!playlistId){
        throw new ApiError(401,"Playlist Id is missing");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(400,"No Playlist found with the given Playlist Id");
    }

    const userId = String(req?.user?._id);
    if(userId !== String(playlist.owner)){
        throw new ApiError(401,"You are not authorized to delete this Playlist")
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res.status(200).json(new ApiResponse(200,playlist));
 

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!name || !description){
        throw new ApiError(401,"All fields are required");
    }

    if(!playlistId){
        throw new ApiError(401,"Playlist Id is missing");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(400,"No Playlist found with the given Playlist Id");
    }

    const userId = String(req?.user?._id);
    if(userId !== String(playlist.owner)){
        throw new ApiError(401,"You are not authorized to update this Playlist")
    }

    playlist.name = name;
    playlist.description = description;

    playlist.save();

    return res.status(200).json(new ApiResponse(200,playlist));

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}