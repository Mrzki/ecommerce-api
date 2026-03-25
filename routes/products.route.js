const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/auth.middleware");
const requireAdmin = require("../middlewares/admin.middleware");

const productsController = require("../controllers/products.controller");
router.get("/", productsController.getAllProduct);
router.get("/:id", productsController.getProduct);
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  productsController.addNewProduct,
);
router.patch(
  "/:id",
  authenticateToken,
  requireAdmin,
  productsController.updateProduct,
);
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  productsController.deleteProduct,
);

module.exports = router;
