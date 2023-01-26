var nodemailer = require("nodemailer");
var multer = require("multer");
const jwt = require("jsonwebtoken");
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_ID,
    pass: process.env.MAIL_PASSWORD,
  },
});

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/users");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `${file.fieldname}_${Date.now()}.${ext}`);
  },
});

var profile_upload = multer({ storage: storage });
var storage2 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/products");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `${file.fieldname}_${Date.now()}.${ext}`);
  },
});

var product_upload = multer({ storage: storage2 });

// middleware function to verify the JWT
const verifyToken = (req, res, next) => {
  // get the token from the request header
  const token = req.headers["authorization"].split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied" });
  }

  try {
    // verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
};

// middleware function to verify the JWT whether the user is Admin or not
const AdminverifyToken = (req, res, next) => {
  // get the token from the request header
  const token = req.headers["authorization"].split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied" });
  }

  try {
    // verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded.isAdmin);
    if (decoded.isAdmin == "true") {
      req.user = decoded;
      next();
    } else {
      res.status(400).json({ message: "User is not an Admin" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Invalid token" });
  }
};

const port = 5000;

module.exports = {
  transporter,
  product_upload,
  profile_upload,
  port,
  verifyToken,
  AdminverifyToken,
};
