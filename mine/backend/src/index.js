const cookieParser = require("cookie-parser");
const result = require("dotenv").config({ path: "./variables.env" });
if (result.error) {
  throw result.error;
}
//console.log(result.parsed);

const createServer = require("./createServer");
const db = require("./db");

const server = createServer();

// Use express middleware for cookies (JWT)
server.express.use(cookieParser());
// TODO Use express middleware to populate current user

server.start(
  {
    cors: {
      credentials: true,
      origin: process.env.FRONTEND_URL
    }
  },
  deets => {
    console.log(`Server is now running on port http://localhost:${deets.port}`);
  }
);
