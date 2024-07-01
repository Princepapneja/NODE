import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { Bucket, Region, S3AccessKey, S3Secret } from "../constants.js"
import { parse } from 'url';
const s3 = new S3Client({
    region:Region,
    credentials: {
        accessKeyId: S3AccessKey,
        secretAccessKey: S3Secret
    }
})
export async function deleteFile(url) {
    console.log(url);
    try {
        const { pathname } = parse(url);
        console.log(pathname);
        const fileKey = decodeURIComponent(pathname.substring(1)); // Remove the leading '/'
        console.log(fileKey);

        const deleteCommand = new DeleteObjectCommand({
            Bucket: Bucket,
            Key: fileKey
        });

        const response = await s3.send(deleteCommand);
        console.log(response);
        console.log(`File '${fileKey}' deleted successfully from bucket '${Bucket}'.`);
    } catch (error) {
        console.error(`Error deleting file  from bucket '${Bucket}':`, error);
    }
}

export default s3