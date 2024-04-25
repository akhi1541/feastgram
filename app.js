const express = require("express");
const app = express();
const userRouter = require("./routes/usersRouter");
const postsRouter =require("./routes/postsRouter")
app.use(express.json())
app.get("/", (req, res) => {
  res.send("working");
});




app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postsRouter);






module.exports = app;