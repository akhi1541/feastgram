const express = require("express");
const multer = require("multer");
const { S3 } = require("aws-sdk");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const s3 = new S3({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
  region: bucketRegion,
});

const uploadToS3Middleware = (req, res, next) => {
  // Upload file to S3
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).send("Error uploading file");
    }
    console.log(req);

    const file = req.file;
    const id = req.body.chefId
    const filename = req.body.fileName
    console.log(id)
    if (!file) {
      if(req.body.type){
        return next()
      }
      return res.status(400).send("No file uploaded");
    }

    const params = {
      Bucket: bucketName,
      Key: id + "_" + file.originalname + filename,
      Body: file.buffer,
      ContentType: file.mimetype
    };

    s3.upload(params, (err, data) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error uploading file to S3");
      }

      // Store the S3 URL in req.body
      req.body.image = data.Location;
      next();
    });
  });
};

module.exports = uploadToS3Middleware;

