import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import fileUploader from "../utils/cloudinary.js";

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
    const avatarLocalPath = req.files?.avatar[0].path;
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


export {
    registerUser,
}