
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const { calculateCPM } = require("../controllers/cpm.controller");

// All CPM routes require authentication
router.use(authMiddleware);

// Calculate Critical Path
router.get("/:projectId", calculateCPM);

module.exports = router;
