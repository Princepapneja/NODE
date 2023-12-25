import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
export const registerUser = asyncHandler(async (req, res) => {
    const { fullName, userName, email, password,avatar } = req.body
    if ([fullName, userName, email, password,avatar].some((field) => field?.trim() === ""))
    {
        throw new ApiError(400, "All Fields are requireds")
    }
    const existingUser = await User.findOne({
        $or: [{ email }, { userName }]
    })
    if (existingUser) {
        throw new ApiError(400, "User allready exists")

    }
    const avatarLocalPath = await req.files?.avatar?.[0]?.path


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar needed")
    }
    const newAvatar = await uploadOnCloudinary(avatarLocalPath)

    if (!newAvatar) {
        throw new ApiError(400, "Avatar needed")

    }
    const user = await User.create({
        fullName,
        avatar: newAvatar.url,
        email,
        userName: userName.toLowerCase(),
        password

    })

    let newUser = await User.findById(user._id).select("-password -refreshToken")
    if (!newUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, newUser, "User registered succesfully")
    )
})
