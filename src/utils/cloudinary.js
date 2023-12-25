import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';




export const uploadOnCloudinary = async (localFilePath) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    try {
        if (!localFilePath) {
            throw new Error('Local file path is missing.');
        }

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        });

        console.log('File is uploaded on Cloudinary:', response.url);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {

        console.error('Error uploading to Cloudinary:', error.message);

        if (fs.existsSync(localFilePath)) {
            // Remove the saved temporary file locally
            fs.unlinkSync(localFilePath);
            console.log('Removed the saved temporary file locally:', localFilePath);
        }

        throw error; // Re-throw the error for handling at a higher level if needed
    }
};
