import express from "express";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import {app} from "./app.js";

dotenv.config({path : "../env"});

connectDB()
.then(()=>{
    const port = process.env.PORT || 3000;
    app.listen(port, ()=>{
        console.log(`Server started at Port: ${port}`)
    })
})
.catch((err)=>{
    console.log("MongoDB failed to connect: ",err)
})
