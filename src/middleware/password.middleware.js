import generatePassword from "../helpers/passwordGenerator.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const passwordGenerator = asyncHandler(async (req, res, next) => {
    
    req.body.password = generatePassword()
    next();
});


;
