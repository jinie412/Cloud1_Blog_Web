// services/s3.js
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

async function uploadFileToS3(fileBuffer, fileName, mimetype) {
  const key = `uploads/${uuidv4()}-${fileName}`;
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimetype,
    ACL: "public-read",
  };

  try {
    const result = await s3.send(new PutObjectCommand(params));
    console.log("Upload to S3 successful:");
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error("Upload to S3 failed:", error);
    throw error;
  }
}

async function deleteFileFromS3(s3Url) {
  const bucket = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;

  const prefix = `https://${bucket}.s3.${region}.amazonaws.com/`;
  const key = s3Url.replace(prefix, "");

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

module.exports = {
  uploadFileToS3,
  deleteFileFromS3,
};
