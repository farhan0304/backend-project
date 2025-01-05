import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));
app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({
    extended:true,
    limit:"16kb"
}));
app.use(express.static("public"));
app.use(cookieParser());

//importing route
import userRoute from "./routes/user.routes.js";
import subscriptionRouter from './routes/subscription.routes.js'
import videoRouter from './routes/video.routes.js'
import { uploadVideoFromCloudinary } from "./controllers/video.controller.js";

app.use("/api/v1/users",userRoute);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos", videoRouter);
app.post("/cloudinary-webhook",uploadVideoFromCloudinary);


export {app}