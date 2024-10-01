import { Router } from "express";
import { registerUser } from "../controllers/register.controller.js";
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

export default userroute;




