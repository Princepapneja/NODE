// uploadMiddleware.mjs

import multer from 'multer';
import multerS3 from 'multer-s3';
import { Bucket, Region, S3AccessKey, S3Secret } from '../constants.js';
import s3 from '../helpers/s3Bucket.js';




const uploadMiddleware = multer({
  storage: multerS3({
    s3: s3,
    bucket: Bucket || "mentalhealthbucket",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      console.log(file,"yha file");
      if (!file) {
        return cb(null, '');
      }

      const timestamp = Date.now().toString();
      const fileName = `${timestamp}-${file.originalname}`;
      const fileUrl = `https://${Bucket}.s3.${Region}.amazonaws.com/profile/${fileName}`;
      
      req.body.image = fileUrl;

      cb(null, `profile/${fileName}`);
    }
  })
})



export default uploadMiddleware;
