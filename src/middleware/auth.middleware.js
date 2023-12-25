import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken';

export const verifyToken = asyncHandler(async (req, res, next) => {
    try {

    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(403, "Unauthorized request");
    }

        const decodedData =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedData?._id).select("-password -accessToken");

        if (!user) {
            throw new ApiError(401, "Invalid Token");
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new ApiError(401, "Invalid Access token");
        }

        throw new ApiError(500, "Internal Server Error",error.message);
    }
});
