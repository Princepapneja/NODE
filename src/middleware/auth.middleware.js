import { Admin } from "../models/admin.model.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken';

export const verifyToken = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || (req.headers["authorization"]?.replace("Bearer ", "") || "").trim();
    if (!token) {
        throw new ApiError(403, "Unauthorized request");
    }

    const decodedData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    let user = {};
    user = await User.findById(decodedData?._id).select("-password").populate("latestMoodSurvey").populate("latestHealthSurvey");
    if (!user) {
        return res.status(401).json("Invalid token")

    }
    req.user = user;
    next();
});
export const verifyTokenAdmin = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || (req.headers["authorization"]?.replace("Bearer ", "") || "").trim();
    if (!token) {
        return res.status(403).json("Unauthorized request")

    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedData) => {
        if (err) {

            if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {

                return res.status(401).json(err.name)

            } else {
                return res.status(500).json(err.name)

            }
        }

        let user = {};
        user = await Admin.findById(decodedData?._id).select("-password");
        if (!user) {
            return res.status(401).json("Invalid Token")
        }
        req.user = user;
        next();
    })

});


;
