import express from "express";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({path : "../env"});
const app = express();

connectDB();
