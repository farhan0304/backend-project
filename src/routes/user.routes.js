import { Router } from "express";
import { registerUser } from "../controllers/register.controller.js";

const userroute = Router();

userroute.route("/register").post(registerUser);

export default userroute;




