const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/auth.middleware");

const authController = require("../controllers/auth.controller");
router.post("/register", authController.userRegister);
router.post("/login", authController.userLogin);
router.get("/me", authenticateToken, authController.getMe);

module.exports = router;
