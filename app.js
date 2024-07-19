const express = require("express");

const cors = require("cors");
const app = express();
app.use(cors());

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
  console.log("care");
  const err = new AppError(404, `cant find ${req.originalUrl} on this page`);
  next(err);
});

app.use(globalErrorHandler);


module.exports = app;
