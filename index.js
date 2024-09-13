const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const PORT = process.env.PORT;
const server = require("http").createServer(app);

// Server
server.listen(PORT || 5000, () => {
  console.log(`server is listening on port:${PORT}`);
});
