import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
const generateToken = async (id) => {
    try {
        const user = await User.findById(id);

        if (!user) {
            throw new ApiError(404, 'User not found');
        }


        const [accessToken, refreshToken] = await Promise.all([
            user?.generateAccessToken(),
            user.generateRefreshToken(),
        ]);

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, error.message);
    }
};
function verifyRefreshToken(token) {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
}
export const registerUser = asyncHandler(async (req, res) => {
    const { fullName, userName, email, password } = req.body;

    if ([fullName, userName, email, password].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({ $or: [{ email }, { userName }] });

    if (existingUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const newAvatar = await uploadOnCloudinary(avatarLocalPath);

    if (!newAvatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: newAvatar.url,
        email,
        userName: userName.toLowerCase(),
        password,
    });

    const newUser = await User.findById(user._id).select("-password -refreshToken");

    if (!newUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(200).json(new ApiResponse(200, newUser, "User registered successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
    const { userName, email, password } = req.body;

    if (!(userName || email)) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({ $or: [{ userName }, { email }] });

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordMatch(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateToken(user._id);

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user, refreshToken, accessToken }, "Logged-in successfully"));
});

export const logout = asyncHandler(async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            $set: {
                refreshToken: ""
            }
        }, {
            new: true
        })
        const options = {
            httpOnly: true,
            secure: true
        }
        return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User logged Out"))

    } catch (err) {
        throw new ApiError(500, "Something went wrong", err.message)

    }
})
export const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const clientToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!clientToken) {
            throw new ApiError(401, "Unauthorized request")
        }

        const decodedToken = verifyRefreshToken(clientToken);

        const user = await User.findById(decodedToken._id);

        if (!user || clientToken !== user.refreshToken) {
            throw new ApiError(401, "Invalid refresh token")
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, refreshToken } = await generateToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, { refreshToken, accessToken }, "Token updated"));
    } catch (err) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);

    if (!(await user.isPasswordMatch(oldPassword))) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});
export const currentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(200, req.user, "current user fetched successfully")
})
export const updateUserDetails = asyncHandler(async (req, res) => {
    const { fullName } = req.body
    if (!fullName) {
        throw new ApiError(400, "All fields are mandatory")
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullName
        }
    }, { new: true }).select("-password")
    return res.status(200).json(new ApiResponse(200, user, "Account updated successfully"))

})
export const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar?.url) {
        throw new ApiError(400, "Avatar file is missing")

    }
    await deleteFromCloudinary(req.user.avatar)
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }, { new: true }).select("-password")
    return res.status(200).json(new ApiResponse(200, user, "Avatar is updated successfully"))

})