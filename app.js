const express = require("express");
const app = express();
const userRouter = require("./routes/usersRouter");
const postsRouter =require("./routes/postsRouter")
const s3Router = require('./utils/s3Load')
app.use(express.json())
app.get("/", (req, res) => {
  res.send("working");
});




app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postsRouter);
app.use('/api/v1/posts/uploadpost',s3Router)






module.exports = app;