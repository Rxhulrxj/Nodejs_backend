const express = require("express");
const app = express();
var path = require("path");
require("dotenv").config();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/public", express.static(path.join(__dirname, "uploads")));

const authroute = require("./routes/auth/auth");
const userroute = require("./routes/user/user");
const productRoute = require("./routes/products/product");
const { port } = require("./common");

app.get("/", (req, res) => {
  res.json({
    status: "success",
    text: "Api is working",
  });
});

app.use("/api/auth/", authroute);
app.use("/api/users/", userroute);
app.use("/api/products/", productRoute);

app.listen(port);
