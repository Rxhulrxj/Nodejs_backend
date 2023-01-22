const router = require("express").Router();
const db = require("../../db_connect");
const { verifyToken, profile_upload } = require("../../common");
var moment = require("moment");
router.get("/getuserprofile", verifyToken, (req, res) => {
  try {
    db.query(
      "SELECT * FROM users WHERE id = ?",
      [req.user._id],
      (err, user) => {
        if (err) throw err;
        return res.json({
          userId: user[0].id,
          fullname: user[0].fullname,
          username: user[0].Username,
          emailaddress: user[0].emailaddress,
          Date_joined: moment(user[0].Date_created).format(
            "DD-MM-YYYY hh:mm:ss A"
          ),
          Date_last_modified: moment(user[0].date_modified).format(
            "DD-MM-YYYY hh:mm:ss A"
          ),
          profile_photo:
            user[0].profile_photo == null
              ? null
              : `${req.protocol}://${req.get("host")}/` + user[0].profile_photo,
          gender: user[0].gender,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch(
  "/update-profile",
  profile_upload.single("profile_photo"),
  verifyToken,
  async (req, res) => {
    try {
      db.query(
        "SELECT * FROM users WHERE id = ?",
        [req.user._id],
        async (err, rows) => {
          if (rows.length == 0) {
            return res.status(401).json({ message: "Access denied" });
          }
          const user = rows[0];
          let update = {};
          if (req.body.fullname) update.fullname = req.body.fullname;
          if (req.body.emailaddress) update.email = req.body.emailaddress;
          if (req.file.filename)
            update.profile_photo = "public/users/" + req.file.filename;
          if (req.body.gender) update.gender = req.body.gender;

          update.date_modified = moment().format("YYYY-MM-DD HH:mm:ss");
          console.log(update);
          db.query(
            "UPDATE users SET ? WHERE id = ?",
            [update, req.user._id],
            (err, result) => {
              if (result.affectedRows == 1) {
                res.json({ message: "Profile updated successfully" });
              } else {
                res.status(400).json({ message: "Error updating profile" });
              }
            }
          );
        }
      );
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
);
module.exports = router;
