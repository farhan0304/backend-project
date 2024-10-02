import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

export const jwtVerify = async (req,res,next) => {
    try {
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
        // console.log(accessToken)
        if (!accessToken){
            res.status(401).json({
                status: "401",
                message: "Access Token not found"
            })
        }
        
        const options = {
            httpOnly: true,
            secure: true
        }
        const decodedAccessToken = jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET,options);
        // console.log(decodedAccessToken)
        const user = await User.findById(decodedAccessToken?.id).select("-password -refreshToken");
        if (!user){
            res.status(401).json({
                status: "401",
                message: "Access Token Invalid"
            })
        }
    
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({
            status: "500",
            message: "Something went wrong while verifying token"
        })
    }
}
