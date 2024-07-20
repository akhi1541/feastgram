const express = require("express");
const router = express.Router();
const authController = require("../controllers/authContorller");
const friendsController = require("../controllers/friendsController");
const uploadToS3Middleware = require("../utils/s3Load");
router.get("/", (req, res) => {
  res.send("working");
});

router.post("/signup", authController.signUpController);
router.post("/login", authController.login);
router.post('/forgetPassword', authController.forgetPassword);
router.post('/resetPassword', authController.resetPassword);
router.post('/updatePassword', authController.updatePassword);

// router.get('/mailVerification/:userId',authContorller.emailVerification)
router.get("/mailVerification/:userId",authController.emailVerification)
router.get(
  "/getAllFrnds/:id",
  authController.protect,
  friendsController.getAllFriends
);
router.patch(
  "/addOrRemoveFrnd",
  authController.protect,
  friendsController.addOrRemoveFriend
);
router.get(
  "/getInfo/:id",
  authController.protect,
  authController.getProfileInfo
);

router.patch(
  "/profile/:userId",
  authController.protect,
  uploadToS3Middleware,
  authController.updateProfile
);

router.get("/testing", authController.protect, (req, res, next) => {
  console.log(req.headers.jwt);
  res.send("token is verified");
});

module.exports = router;
