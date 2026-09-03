const express = require("express");

const { createGroup, getGroups, joinGroup, leaveGroup } = require("../controllers/groupcontroller.js");
const protect = require("../middleware/authMiddleware.js");

const router = express.Router();

router.get("/", getGroups);
router.post("/", protect, createGroup);
router.post("/:id/join", protect, joinGroup);
router.post("/:id/leave", protect, leaveGroup);

module.exports = router;
