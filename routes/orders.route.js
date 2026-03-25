const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/auth.middleware");

const ordersController = require("../controllers/orders.controller");
router.post("/", authenticateToken, ordersController.order);
router.get("/", authenticateToken, ordersController.getAllOrder);
router.get("/:id", authenticateToken, ordersController.getOrder);

module.exports = router;
