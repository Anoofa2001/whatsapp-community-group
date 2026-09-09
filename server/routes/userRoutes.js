const express = require("express");

const { registerUser, loginUser, loginAdmin } = require("../controllers/authcontroller.js");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin-login", loginAdmin);

module.exports = router;
