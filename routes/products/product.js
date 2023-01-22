const router = require("express").Router();
const db = require("../../db_connect");
const axios = require("axios");
const { verifyToken } = require("../../common");

router.get("/addsample-products", verifyToken, async (req, res) => {
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
      ]);
    }
    db.query(
      "Insert into products(product_name,product_image,product_image2,product_image3,product_description,product_price,thumbnail,rating,brand,category) Values ?",
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
module.exports = router;
