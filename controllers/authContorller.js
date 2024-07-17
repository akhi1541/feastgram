const Users = require("../models/usersModel");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const crypto = require("crypto");

const catchAsync = require("../utils/catchAsync");
const mailservice = require("../utils/email");
const AppError = require("../utils/appError");
const oAuthLogin = false;

const loginTo = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECURITY_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });
};

const createSendToken = (user, statusCode, message, res) => {
  //*cookie is just a piece of txt which is sent from server to client which client stores it and sends it  back to the server for (like jwt to get acess) all future reqs

  const token = loginTo(user.id);

  // const cookieOptions = {
  //   expires: new Date(
  //     Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000
  //   ),
  //   httpOnly: true,
  // };
  // if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  // res.cookie("jwt", token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: "sucess",
    token,
    message: message,
    data: user,
  });
};

exports.signUpController = catchAsync(async (req, res, next) => {
  if (await Users.findOne({ email: req.body.email })) {
    return next(new AppError(400, "User Already Exists Please Login "));
  }
  const newUser = await Users.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordModifiedAt: req.body.passwordModifiedAt,
    role: req.body.role,
  });
  const redirectURL = `http://localhost:3000/api/v1/users/mailVerification/${newUser._id}`;
  mailservice({
    email: req.body.email,
    subject: "Mail verification",
    html: `<h2>
        Click on the link to verify your email address{"${newUser.email}"}
        <a href="${redirectURL}">approve</a>
      </h2>`,
  });
  createSendToken(newUser, 200, "user created sucesfully", res);

});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    console.log('"please provide email and password"');
    return next(new AppError(400, "please provide email and password"));
  }
  //*2 check  if user  exists  in database and password is correct
  const user = await Users.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    console.log('"please wreo"');
    return next(new AppError(400, "Incorrect email or password"));
  }

  createSendToken(user, 200, "login sucessful", res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  //1.check token n if its there
  if (req.headers.jwt && req.headers.jwt.startsWith("Bearer")) {
    token = req.headers.jwt.split(" ")[1];
    //     req.headers.authorization &&
    //     req.headers.authorization.startsWith("Bearer")
    //   ) {
    //     token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    // return next(new AppError(401, "you are not logged in please login"));
    return res.status(401).json({
      message: "you are not logged in please login",
    });
  }
  //2.verify token using jwt verify to get payload(id)
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECURITY_KEY
  );

  if (!decoded) {
    // return next(new AppError(401, "jwt verification is failed"));
    return res.status(400).json({
      message: "please provide email and password",
    });
  }
  //3.check if user still exists
  const currentUser = await Users.findOne({ _id: decoded.id });
  if (!currentUser) {
    return res.status(400).json({
      message: "please provide email and password",
    });
    // return next(
    // //   new AppError(401, "The user belong to this token does no longer exists")

    // );
  }

  //4.check if password is modified or not afer token is issued

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    // return next(new AppError(401, "password is changed please login agian"));
    return res.status(400).json({
      message: "please provide email and password",
    });
  }
  //5.grant acess
  req.user = currentUser;
  next();
});

exports.getProfileInfo = catchAsync(async (req, res) => {
  const id = req.params.id;
  const details = await Users.findById(id).select(
    "_id profilePicture email name bio mailVerified"
  );

  if (!details) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({ status: "success", data: details });
});

exports.updateProfile = catchAsync(async (req, res) => {
  console.log(req.body);
  const { name, email, bio } = req.body;
  const userId = req.params.userId;
  const image = req.body.image;
  console.log(userId);

  const updatedProfile = {
    name,
    email,
    profilePicture: image,
    bio,
  };

  const user = await Users.findOneAndUpdate(
    { _id: userId },
    updatedProfile,
    { new: true } // This option returns the modified document
  );

  if (!user) {
    return res.status(404).json({
      status: "fail",
      message: "User not found",
    });
  }

  res.status(200).json({
    data: user,
    status: "success",
  });
});

exports.emailVerification = catchAsync(async (req, res, next) => {
  const userId = req.params.userId;
  const user = await Users.findByIdAndUpdate(
    userId,
    { mailVerified: true },
    { new: true }
  );
  console.log("Updated User: ", user);

  res.send(`<H1>You are verified</H1>`);
});

exports.forgetPassword = catchAsync(async (req, res, next) => {
  //1)get user based on posted email in the req body(findOne)
  const user = await Users.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError(404, "User not found with given email"));
  }
  //2)generate the random reset token (crypto)
  const resetToken = user.passwordResetTokenGenerate();
  await user.save({ validateBeforeSave: false }); //this will  turn off  all the validators which we have declared in schema for password to be required and a lo
  const resetUrl = `http://localhost:4200/resetPage/${resetToken}`;
  const message = `this is your reset password url plese click this to  change password ${resetUrl}.If you remember the password just ignore this mail`;
  //4)send it back to the user email to reset password
  try {
    await mailservice({
      email: user.email,
      subject: "Your password reset token valid for 10min",
      message: message,
    });
    res.status(200).json({
      status: "sucess",
      message: "token has sent to email sucessfully",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err);
    return next(
      new AppError(
        500,
        "There was an error in sending email! Please retry again "
      )
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  const token = crypto
    .createHash("sha256")
    .update(req.body.token)
    .digest("hex");

  const user = await Users.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or expired", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, "Password reset successful", res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1 get the user form the database
  const user = await Users.findById(req.user._id).select("+password");
  //*here as the user is already already logged in we need not check the user exists or  not
  //2 check if posted password is correct
  if (!(await user.correctPassword(req.body.password, user.password))) {
    return next(
      new AppError(
        403,
        "Given current password is incorrect please check it in order to update the password"
      )
    );
  }
  //3 update the password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();
  //4 Login user,send jwt

  createSendToken(user, 200, "password updated sucessfull", res);
});
