var mysql = require("mysql2");

var con = mysql.createConnection({
  host: "localhost", //host name
  user: "root", // your mysql username default is root
  password: "", // your mysql user password default for root is empty
  dateStrings: true, // used to display date in proper formats
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
  con.query(
    "CREATE DATABASE IF NOT EXISTS flutterbackend ",
    async function (err, result) {
      if (err) throw err;
      con.query("use flutterbackend");
      con.query(
        "Create TABLE if not exists users(id int primary key auto_increment,fullname varchar(200),emailaddress varchar(200)NOT null UNIQUE,Username varchar(200) Not null UNIQUE,password varchar(200),Date_created datetime default current_timestamp(),isAdmin ENUM('false', 'true') NOT NULL DEFAULT 'false',profile_photo text,gender ENUM('Male', 'Female','Others'),date_modified datetime default current_timestamp())"
      );
      con.query(
        "Create TABLE if not exists passwordreset(id int primary key auto_increment,otp int not null,user_id int unique,Foreign key(user_id) References users(id))"
      );
      con.query(
        "Create TABLE if not exists products(id int primary key auto_increment,product_name varchar(200) Unique,product_image text,product_image2 text,product_image3 text,product_description text,product_price float,Date_Added date default current_timestamp(),date_modified date default current_timestamp(),thumbnail text,rating float,brand varchar(200),category varchar(200))"
      );
    }
  );
});

module.exports = con;
