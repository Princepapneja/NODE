import { Router } from "express";
import { loginUser, logout, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyToken } from "../middleware/auth.middleware.js";
const userRouter = Router()
userRouter.route("/register").post(
    upload.fields([
        {     
            name: "avatar",
            maxCount: 1
        }
    ]),registerUser)
userRouter.route("/login").post(
    loginUser
)



//secure routes
userRouter.route("/logout").post(verifyToken, logout)
userRouter.route("/refresh-token").post(refreshAccessToken)
export default userRouter