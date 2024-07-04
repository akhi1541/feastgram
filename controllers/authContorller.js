const Users = require("../models/usersModel");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const crypto = require("crypto");
const oAuthLogin = false;

const loginTo = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECURITY_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });
};

const createSendToken = (user, statusCode, message, res) => {
  //*cookie is just a piece of txt which is sent from server to client which client stores it and sends it  back to the server for (like jwt to get acess) all future reqs

  const token = loginTo(user.id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: "sucess",
    token,
    message: message,
    data: user,
  });
};

exports.signUpController = async (req, res, next) => {
  try {
    const newUser = await Users.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordModifiedAt: req.body.passwordModifiedAt,
      role: req.body.role,
    }).catch((err) => {
      console.log(err.name, err.message,);
      res
        .status(400)
        .json({ message: err.message , status: "failed" });
    });
    createSendToken(newUser, 200, "user created sucesfully", res);
  } catch (error) {
    console.log("error", error);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  //*1 check if email password exists
  if (!email || !password) {
    console.log('"please provide email and password"');
    return res.status(400).json({
      message: "please provide email and password",
    });
    // return next(new AppError(400, "please provide email and password"));
  }
  //*2 check  if user  exists  in database and password is correct
  const user = await Users.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    // return next(new AppError(400, "Incorrect email or password"));
    return res.status(400).json({
      message: "please provide email and password",
    });
  }
  //*3 if everything is of generate the token and send it to the client
  createSendToken(user, 200, "login sucessful", res);
};

exports.protect = async (req, res, next) => {
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
};

exports.getProfileInfo = async (req, res) => {
  try {
    const id = req.params.id;
    const details = await Users.findById(id).select(
      "_id profilePicture email name"
    );

    if (!details) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ status: "success", data: details });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    console.log(req.body);
    const { name, email } = req.body;
    const userId = req.params.userId;
    const image = req.body.image;
    console.log(userId);

    const updatedProfile = {
      name,
      email,
      profilePicture: image,
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
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "An error occurred while updating the profile",
    });
  }
};
