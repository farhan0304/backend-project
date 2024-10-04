import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/register.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { jwtVerify } from "../middlewares/auth.middleware.js";

const userroute = Router();

userroute.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ])
    ,registerUser);

userroute.route("/login").post(loginUser);

// secure routes
userroute.route("/logout").get(jwtVerify,logoutUser);

userroute.route("/refresh-token").post(refreshAccessToken)

userroute.route("/change-password").patch(jwtVerify,changeCurrentPassword)

userroute.route("/current-user").get(jwtVerify, getCurrentUser)

userroute.route("/update-account").patch(jwtVerify, updateAccountDetails)

userroute.route("/avatar").patch(jwtVerify, upload.single("avatar"), updateUserAvatar)

userroute.route("/cover-image").patch(jwtVerify, upload.single("coverImage"), updateUserCoverImage)

export default userroute;




