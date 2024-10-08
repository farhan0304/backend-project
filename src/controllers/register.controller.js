import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import fileUploader from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import fileDelete from "../utils/DeleteFile.js";


const generateAccessAndRefereshToken = async(userid)=>{
    try {
        const user = await User.findById(userid);
        if(!user){
            throw new ApiError(401,"Invalid userid")
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
    
        user.refreshToken = refreshToken;
        user.save({validateBeforeSave: false})
        return {
            accessToken,
            refreshToken
        }
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating Acess and Refresh token")
    }
}

const registerUser = asyncHandler( async(req,res)=>{
    // first take username, email, fullname, password from user
    // check for validation
    // check for avatar and coverimage
    // upload avatar and coverimage to server from multer
    // check if avatar and coverimage are uploaded in server successfully
    // upload avatar and coverimage in cloudinary and get their url
    // make a user object and create a user in db
    // send the user object exluding password and refresh tokken as json response
    const {username, email, fullName, password} = req.body;
    
    // console.log(req.files);
    if (!username || !email || !fullName || !password ){
        throw new ApiError(400,"All fields are required");
    }
    const userExisted = await User.findOne( 
        {
            $or: [{ username },{ email }]
        }
    )
    if (userExisted){
        throw new ApiError(409,"User already existed");
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if (req.files?.coverImage){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    if (!avatarLocalPath){
        throw new ApiError(401,"Avatar is required");
    }
    const avatar = await fileUploader(avatarLocalPath);
    let coverImage;
    if(coverImageLocalPath){
        coverImage = await fileUploader(coverImageLocalPath);
    }
    if (!avatar) {
        throw new ApiError(400, "Avatar file not uploaded")
    }

    const newuser = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password
    })
    if (!newuser){
        throw new ApiError(501,"User can't be created :(");
    }
    res.status(201).json({
        username,
        email,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

})

const loginUser = asyncHandler( async(req,res)=>{
    // get data from req body
    // validate the data
    // check for user in db
    // if user exists then check for password
    // generate access token and refresh token and store in cookie and refresh token in db
    // give json response
    const {username,email,password} = req.body;
    if (!username && !email){
        throw new ApiError(401,"Username or email is required")
    }
    const user = await User.findOne({
        $or : [{ username },{ email }]
    })
    if (!user){
        throw new ApiError(401,"Username or email is incorrect")
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid){
        throw new ApiError(401,"Invalid User Credentials")
    }
    const {accessToken,refreshToken} =await generateAccessAndRefereshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json( new ApiResponse(200,
        {
            user: loggedInUser, accessToken, refreshToken

        }
    ) )

})

const logoutUser = asyncHandler( async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res)=>{
    const {oldPassword,newPassword} = req.body;
    if (!oldPassword || !newPassword){
        throw new ApiError(401, "All fields are required")
    }
    const user = await User.findById(req.user._id);
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordValid){
        throw new ApiError(401,"Old Password is incorrect");
    }
    user.password = newPassword;
    user.save({validateBeforeSave:false})

    res.status(200).json({
        status: 200,
        message: "Password change successfully"
    })

})

const getCurrentUser = asyncHandler(async (req,res)=>{
    const user = req.user;

    if(!user){
        throw new ApiError(500,"Something went wrong while fetching User Details")
    }
    res.status(200).json(new ApiResponse(200,user,"User Details fetched successfully"));
})

const updateAccountDetails = asyncHandler(async (req,res)=>{
    const {email, fullName} = req.body;
    if (!email && !fullName){
        throw new ApiError(401,"Fields can't be empty")
    }
    const user = await User.findByIdAndUpdate(req.user._id,{
        $set:{
            email,fullName
        }
    },{
        new:true
    }).select("-password -refreshToken");

    if (!user){
        throw new ApiError(500,"OOPS something went wrong while changing Account Details")
    }

    res.status(200).json(
        new ApiResponse(200,user,"Account Details successfully Updated")
    )
})

const updateUserAvatar = asyncHandler(async (req,res)=>{
    const localFilePath = req?.file?.path;
    const avatarResponse = await fileUploader(localFilePath);
    const avatar = avatarResponse?.url;
    const oldAvatarUrl = req.user?.avatar;
    const publicId = oldAvatarUrl.match(/upload\/(?:v\d+\/)?([^\.]+)/)[1];
    
    // console.log(publicId)

    const user = await User.findByIdAndUpdate(req.user._id,{
        $set:{
            avatar
        }
    },{
        new: true
    }).select("-password -refreshToken");

    if (!user){
        throw new ApiError(401,"Avatar did not changed")
    }
    
    const deleteResult = await fileDelete(publicId);

    res.status(200).json(
        new ApiResponse(200,user,"Avatar change successfully")
    )
})

const updateUserCoverImage = asyncHandler(async (req,res)=>{
    const localFilePath = req?.file?.path;
    const coverImageResponse = await fileUploader(localFilePath);
    const coverImage = coverImageResponse?.url;

    const oldCoverimageUrl = req.user?.coverImage;
    const publicId = oldCoverimageUrl.match(/upload\/(?:v\d+\/)?([^\.]+)/)[1];
    // console.log(publicId)

    const user = await User.findByIdAndUpdate(req.user._id,{
        $set:{
            coverImage
        }
    },{
        new: true
    }).select("-password -refreshToken");

    if (!user){
        throw new ApiError(401,"Cover Image did not changed")
    }

    const deleteResult = await fileDelete(publicId);

    res.status(200).json(
        new ApiResponse(200,user,"Cover Image change successfully")
    )
})

const channelInfo = asyncHandler(async (req,res)=>{
    const username = req.params;
    if (!username){
        throw new ApiError(404,"Username is not Provided");
    }
    const userChannel = await User.aggregate([
        {
          '$match': {
            username
          }
        }, {
          '$lookup': {
            'from': 'subscriptions', 
            'localField': '_id', 
            'foreignField': 'channel', 
            'as': 'SubscribersUser'
          }
        }, {
          '$lookup': {
            'from': 'subscriptions', 
            'localField': '_id', 
            'foreignField': 'subscriber', 
            'as': 'SubscriberedToUser'
          }
        }, {
          '$addFields': {
            'subscriberCount': {
              '$size': '$SubscribersUser'
            }, 
            'subscribedToCount': {
              '$size': '$SubscriberedToUser'
            }, 
            'isSubscribed': {
              '$cond': {
                'if': {
                  '$in': [
                    req.user?._id, '$SubscribersUser.subscriber'
                  ]
                }, 
                'then': true, 
                'else': false
              }
            }
          }
        }, {
          '$project': {
            '_id': 1,
            'username': 1,
            'fullName': 1, 
            'subscriberCount': 1, 
            'subscribedToCount': 1, 
            'isSubscribed': 1
          }
        }
      ])

      console.log(userChannel)

      if (!userChannel) {
        throw new ApiError(404,"Channel doesn't exist")
      }

      return res.status(201)
      .json( new ApiResponse(201,userChannel,"Channel Details Successfully Fetched"))
      

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    channelInfo

}