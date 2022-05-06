const express = require("express");
const app = express();

function keepAlive(port) {
  if (!port) port = 3000;
  app.get("/", (req, res) => {
    res.status(200).send("Hosting is working!");
  });
  app.listen(port);
  console.log(`Bot hosting is now listening on port ${`${port}`.blue}!`);
}

module.exports = { keepAlive };
