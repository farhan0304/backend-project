import { Router } from "express";
import { loginUser, registerUser } from "../controllers/register.controller.js";
import {upload} from "../middlewares/multer.middleware.js"

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

export default userroute;




