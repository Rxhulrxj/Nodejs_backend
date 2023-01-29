const router = require("express").Router();
const db = require("../../db_connect");
const axios = require("axios");
var moment = require("moment");
const {
  verifyToken,
  AdminverifyToken,
  product_upload,
} = require("../../common");

router.get("/addsample-products", AdminverifyToken, async (req, res) => {
  try {
    let response = await axios.get("https://dummyjson.com/products?limit=200");
    let data = response.data.products;
    var values = [];
    for (let key = 0; key < data.length; key++) {
      let productname,
        product_image,
        product_image2,
        product_image3,
        product_description,
        product_price,
        thumbnail,
        rating,
        brand,
        category;
      productname = data[key].title;

      if (data[key].images.length == 1 || data[key].images.length > 0) {
        product_image = data[key].images[0];
      }
      if (data[key].images.length == 2 || data[key].images.length > 1) {
        product_image2 = data[key].images[1];
      }
      if (data[key].images.length == 3 || data[key].images.length > 2) {
        product_image3 = data[key].images[2];
      }
      if (data[key].description) product_description = data[key].description;
      if (data[key].price) product_price = data[key].price;
      if (data[key].thumbnail) thumbnail = data[key].thumbnail;
      if (data[key].rating) rating = data[key].rating;
      if (data[key].brand) brand = data[key].brand;
      if (data[key].category) category = data[key].category;
      values.push([
        productname,
        product_image,
        product_image2,
        product_image3,
        product_description,
        product_price,
        thumbnail,
        rating,
        brand,
        category,
        req.user._id,
      ]);
    }
    db.query(
      "Insert into products(product_name,product_image,product_image2,product_image3,product_description,product_price,thumbnail,rating,brand,category,user_id) Values ?",
      [values],
      (err, result) => {
        if (err) {
          return res.status(400).json({
            message: "Something went wrong or duplicate product name found",
            reason: err.message,
          });
        }
        if (result) {
          return res.json({ message: "products added successfully" });
        }
      }
    );
  } catch (ERR) {
    return res
      .status(500)
      .json({ message: "Something Went Wrong", reason: ERR.message });
  }
});

router.get("/get-products", verifyToken, (req, res) => {
  db.query("SELECT * FROM products", (err, result) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    res.json({ success: true, products: result });
  });
});
router.get("/search-product", verifyToken, (req, res) => {
  let searchkeyword = req.query.search;
  db.query(
    "SELECT * FROM products where product_name Like ?",
    ["%" + searchkeyword + "%"],
    (err, result) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      res.json({ success: true, products: result });
    }
  );
});

router.post(
  "/add-product",
  product_upload.fields([
    {
      name: "product_image",
      maxCount: 1,
    },
    {
      name: "product_image2",
      maxCount: 1,
    },
    {
      name: "product_image3",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  AdminverifyToken,
  (req, res) => {
    let productname = req.body.productname;
    if (productname == null || productname == undefined) {
      return res.status(400).json({ message: "Product name is Required" });
    } else {
      db.query(
        "SELECT * FROM products WHERE product_name=?",
        productname,
        (err, result) => {
          if (err) {
            return res.status(400).json({ message: err.message });
          }
          if (result.length > 0) {
            return res.status(400).json({ message: "Item Already Exists" });
          } else {
            db.query(
              "Insert into products(product_name,product_image,product_image2,product_image3,product_description,product_price,thumbnail,rating,brand,category,user_id,date_modified) Values (?,?,?,?,?,?,?,?,?,?,?,?)",
              [
                productname,
                req.files.product_image == undefined ||
                req.files.product_image == null
                  ? null
                  : "public/products/" + req.files.product_image[0].filename,

                req.files.product_image2 == undefined ||
                req.files.product_image2 == null
                  ? null
                  : "public/products/" + req.files.product_image2[0].filename,

                req.files.product_image3 == undefined ||
                req.files.product_image3 == null
                  ? null
                  : "public/products/" + req.files.product_image3[0].filename,
                req.body.product_description,
                req.body.product_price,
                req.files.thumbnail == undefined || req.files.thumbnail == null
                  ? null
                  : "public/products/" + req.files.thumbnail[0].filename,
                req.body.rating,
                req.body.brand,
                req.body.category,
                req.user._id,
                moment().format("YYYY-MM-DD HH:mm:ss"),
              ],
              (er, resul) => {
                console.log(er);
                if (er) return res.status(400).json({ message: er.message });
                if (resul) {
                  return res.json({
                    message: "products Added successfully",
                  });
                }
              }
            );
          }
        }
      );
    }
  }
);

router.get("/product-detail/:id", verifyToken, (req, res) => {
  let productid = req.params.id;
  if (productid == null || productid == undefined) {
    return res.status(400).json({ message: "Provide Product Id" });
  }
  db.query("select * from products where id=?", [productid], (err, product) => {
    if (err) return res.status(400).json({ message: err.message });
    if (product) return res.json({ success: true, products: product });
  });
});

router.get("/delete-product/:id", AdminverifyToken, (req, res) => {
  let productId = req.params.id;
  if (productId == null || productId == undefined) {
    return res.status(400).json({
      message: "Product Id is required",
    });
  } else {
    db.query(
      "Select * from products where id=?",
      parseInt(productId),
      (err, product) => {
        if (err) return res.status(400).json({ message: err.message });
        if (product) {
          db.query(
            "Delete  from products where id=?",
            parseInt(productId),
            (er, prod) => {
              if (er) return res.status(400).json({ message: er.message });
              if (prod.affectedRows == 1) {
                res.json({
                  success: true,
                  message: "Product Deleted Successfully",
                });
              }
            }
          );
        }
      }
    );
  }
});
module.exports = router;
