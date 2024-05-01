const express = require("express");
const router = express.Router();
const S3 = require("aws-sdk").S3;
const multer = require("multer");

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.AWS_ACCESS_KEY_ID;
const secretAccess_key = process.env.AWS_SECRET_ACCESS_KEY;

const credentials = {
  accessKeyId: accessKey,
  secretAccessKey: secretAccess_key,
  region: bucketRegion,
};

console.log(bucketName);
// Create an instance of the S3 class with credentials
const s3 = new S3(credentials);

// Define multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define a route to handle file uploads
router.post("/upload", upload.single("minion"), (req, res) => {
  const file = req.file;
  console.log(req.file);

  // Upload file to S3
  const params = {
    Bucket: bucketName,
    Key: file.originalname,
    Body: file.buffer,
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error uploading file to S3");
      return;
    }

    // File uploaded successfully
    res.json(data)
  });
});

router.get("/", (req, res) => {
  const params = {
    Key: "pika.jpg",
    Bucket: bucketName,
    Expires: 3600,
  };

  /*
  this is to get the actual data
  s3.getObject(params, (err, data) => {
    if (err) {
        console.error('Error fetching image from S3:', err);
    } else {
        // Process the retrieved object data
        console.log('Object metadata:', data.Metadata);
        console.log('Content type:', data.ContentType);
        console.log('Content length:', data.ContentLength);

        // Access the object content (file data)
        const fileData = data.Body;

        // Do something with the file data...
    }
});
  */

  const url = s3.getSignedUrl("getObject", params);
  res.json({
    url,
  });
  console.log("url", url);
});

module.exports = router;
