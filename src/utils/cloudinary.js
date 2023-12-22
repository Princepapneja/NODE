import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary=(async (localFilePath)=>{
try{
    if(!localFilePath){
        return null
    }
    let resp = await cloudinary.uploader.upload(localFilePath,{
        resource_type:"auto"
    })

    // file is uploaded on cloudinary
    console.log("file is uploaded on cloudinary " ,response.url)
    return response
} catch(error){
fs.unlinkSync(localFilePath)
// remove the saved temp file which is localy saved 
}
})




cloudinary.v2.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
  { public_id: "olympic_flag" }, 
  function(error, result) {console.log(result); });