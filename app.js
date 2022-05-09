const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get(["/", "/home"], (req, res) => {
  res.status(200).send("Main page coming soon!");
});

app.listen(port);
console.log(
  "The website for the client is now listening on port ".green +
    `${port}`.blue +
    "!".green
);
