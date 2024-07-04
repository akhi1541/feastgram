const express = require("express");
const app = express();
const userRouter = require("./routes/usersRouter");
const postsRouter = require("./routes/postsRouter");
const cors = require('cors')
const s3Router = require("./utils/s3Load");
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.get("/", (req, res) => {
  res.send("working");
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postsRouter);


module.exports = app;
