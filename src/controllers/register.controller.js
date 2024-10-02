import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import fileUploader from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
    await User.findByIdAndUpdate(req.user._id,{
        $set: {refreshToken:undefined}
    },{
        new:true
    });

    const options = {
        httpOnly:true,
        secure:true
    }

    res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{
            data:"User logged out"
        })
    )
})
export {
    registerUser,
    loginUser,
    logoutUser
}