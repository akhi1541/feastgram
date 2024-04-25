const mongoose = require("mongoose");
require("dotenv").config();

process.on("uncaughtException", (err) => {
  //*this should be in the top of code so there is no uncaught error before it
  console.log(err.name, err.message);
  console.log("UNCAUGHT EXCEPTION! shutting down");
  process.exit(1); //*0 for sucess and 1 for exception
});

const url = process.env.DB_URL;
mongoose.connect(url).then(() => {
  console.log(`DB connected `);
});

const app = require("./app");
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDELED REJECTION! shutting down");
  server.close(() => {
    process.exit(1); //*0 for sucess and 1 for exception
  });
});
