const express = require("express");
const helmet = require("helmet")
const cors = require("cors");
//const { xss } = require('express-xss-sanitizer');
const mongoSanitize = require('express-mongo-sanitize')
const {rateLimit} = require('express-rate-limit')
const hpp = require('hpp')
const app = express();

app.use(cors());
app.use(helmet())
// app.use(xss())
app.use(mongoSanitize())
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);


const limiter = rateLimit({
  //*this is used to limit the no of reqs from a same ip address in order to overcome brut froce attacks
  max: 90, //*max no of reqs windowMs time
  windowMs: 60 * 60 * 1000, //*no of reqs per this time here we have given 1hr so for every 1hr the limiter is resetted
  message: 'To many reqs from this IP,please try again after one hour',
});
app.use('/api', limiter);

const userRouter = require("./routes/usersRouter");
const postsRouter = require("./routes/postsRouter");
const chatsRouter = require("./routes/chatsRouter");
const socketInit = require("./utils/socket")

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const s3Router = require("./utils/s3Load");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.send("working");
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postsRouter);
app.use("/api/v1/chats", chatsRouter);
socketInit()


app.all("*", (req, res, next) => {
  //console.log("care");
  const err = new AppError(404, `cant find ${req.originalUrl} on this page`);
  next(err);
});

app.use(globalErrorHandler);


module.exports = app;
