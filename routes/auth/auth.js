const router = require("express").Router();
const db = require("../../db_connect");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
var moment = require("moment");
const { transporter } = require("../../common");
router.post("/register", async (req, res) => {
  try {
    let username = req.body.username;
    let fullname = req.body.fullname;
    let password = req.body.password;
    let emailaddress = req.body.emailaddress;
    if (username == null || username == undefined) {
      res.status(400).json({ message: "Username is required" });
    } else if (fullname == null || fullname == undefined) {
      res.status(400).json({ message: "fullname is required" });
    } else if (password == null || password == undefined) {
      res.status(400).json({ message: "password is required" });
    } else if (emailaddress == null || emailaddress == undefined) {
      res.status(400).json({ message: "emailaddress is required" });
    } else {
      db.query(
        "select * from users where username=? OR emailaddress= ?",
        [username, emailaddress],
        async (err, result) => {
          if (err) throw err;
          if (result.length > 0) {
            res.status(400).json({ message: "User Already Exists" });
          } else {
            try {
              // hash the password
              const hashedPassword = await bcrypt.hash(password, 10);
              // insert the new user into the database
              const result = db.query(
                "INSERT INTO users (fullname,Username, emailaddress,password) VALUES (?,?,?,?)",
                [fullname, username, emailaddress, hashedPassword]
              );
              res.json({ message: "User created successfully" });
            } catch (error) {
              res.status(500).json({ message: error.message });
            }
          }
        }
      );
    }
  } catch (e) {
    console.log(e.message);
    res.status(500).json({ message: e.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    // find the user in the database
    db.query(
      "SELECT * FROM users WHERE Username = ?",
      [req.body.username],
      async (err, result) => {
        if (result.length == 0) {
          return res
            .status(400)
            .json({ message: "username or password is invalid" });
        }
        const user = result[0];
        // compare the password
        const valid = await bcrypt.compare(req.body.password, user.password);
        if (!valid) {
          return res.status(400).json({ message: "Password is invalid" });
        }

        // create a JWT
        const token = jwt.sign(
          { _id: user.id, isAdmin: user.isAdmin },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );

        res.json({
          userId: user.id,
          username: user.Username,
          emailaddress: user.emailaddress,
          token: token,
        });
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/password-reset", (req, res) => {
  let useremailaddress = req.body.emailaddress;
  let otp = Math.floor(100000 + Math.random() * 900000);
  if (useremailaddress == null || useremailaddress == undefined) {
    return res.status(400).json({ message: "Email Address is Required" });
  }
  db.query(
    "select * from users where emailaddress=?",
    useremailaddress,
    (err, result) => {
      if (err) throw err;
      if (result.length == 0) {
        return res.status(400).json({ message: "User Not Found" });
      } else {
        let user_id = result[0].id;
        db.query(
          "select * from passwordreset where user_id=?",
          user_id,
          (err, respon) => {
            if (respon.length > 0) {
              return res.status(400).json({
                message: "Password Reset Failed",
                Reason: "Otp Already Sent to Email",
              });
            }
          }
        );
        db.query(
          "Insert into passwordreset(otp,user_id) values(?,?)",
          [otp, user_id],
          (err, successdata) => {
            if ((successdata.affectedRows = 1)) {
              var mailOptions = {
                from: process.env.MAIL_ID,
                to: useremailaddress,
                subject: "Password Reset Request",
                html: `
              <p>Need to reset your password?</p><br />
              
              <p>Use your secret code!</p><br />
              
              <b>${otp}</b> <br />
              
              
              <p>If you did not forget your password, you can ignore this email.</p>
              `,
              };
              transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                  return res.status(400).json({ error: error.message });
                } else {
                  return res.json({
                    success: true,
                    user_id: user_id,
                    message: "Mail send successfully",
                  });
                }
              });
            } else {
              return res
                .status(400)
                .json({ error: "Something Went Wrong! Please try again" });
            }
          }
        );
      }
    }
  );
});

router.post("/get-otp", (req, res) => {
  if (req.body.userid == null || req.body.userid == undefined) {
    return res.status(400).json({ message: "UserId is Required" });
  }
  let user_id = req.body.userid;
  db.query(
    "select * from passwordreset where user_id = ?",
    user_id,
    (err, result) => {
      if (!result) {
        return res.status(400).json({ message: "No otp found" });
      } else {
        return res.json({
          fieldid: result[0].id,
          userid: result[0].user_id,
          otp: result[0].otp,
        });
      }
    }
  );
});

router.post("/confirm-password", (req, res) => {
  let password = req.body.password;
  let user_id = req.body.userid;
  let fieldid = req.body.fieldid;
  if (password == null || password == undefined) {
    return res.status(400).json({ message: "New Password is Required" });
  } else if (user_id == null || user_id == undefined) {
    return res.status(400).json({ message: "user_id is Required" });
  } else if (fieldid == null || fieldid == undefined) {
    return res.status(400).json({
      message: "fieldid is Required",
      Reason: "Passed While getting otp",
    });
  } else {
    db.query(
      "select * from users where id =?",
      user_id,
      async (err, result) => {
        if (result.length == 0) {
          return res.status(400).json({ message: "No User Found" });
        } else {
          if (result[0].password == password) {
            return res
              .status(400)
              .json({ message: "Password previously used" });
          } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            db.query(
              "Update users set? where id=?",
              [
                {
                  password: hashedPassword,
                  date_modified: moment().format("YYYY-MM-DD HH:mm:ss"),
                },
                user_id,
              ],
              (err, respon) => {
                if (respon.affectedRows == 1) {
                  db.query(
                    "Delete  from passwordreset where id=?",
                    [fieldid],
                    (err, resp) => {
                      if (resp.affectedRows == 1) {
                        return res.json({
                          success: true,
                          message: "Password Reset Successful",
                        });
                      }
                    }
                  );
                } else {
                  return res
                    .status(400)
                    .json({ message: "Something Went Wrong" });
                }
              }
            );
          }
        }
      }
    );
  }
});

module.exports = router;
