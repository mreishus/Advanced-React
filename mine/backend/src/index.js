const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

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

// Use express middleware to populate current user
server.express.use((req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    req.userId = userId;
  }
  next();
});

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
