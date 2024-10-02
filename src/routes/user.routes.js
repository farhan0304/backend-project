import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/register.controller.js";
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

export default userroute;




