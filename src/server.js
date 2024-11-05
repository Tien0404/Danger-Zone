const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const cors = require("cors");
const initRoutes = require("./routers/index");
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
connectDB();
app.use(cookieParser());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS", "PUT"],
  })
);
app.use(express.json());
initRoutes(app);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
