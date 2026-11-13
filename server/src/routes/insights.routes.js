
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const {
  generateProjectInsights,
} = require("../controllers/insights.controller");

// All insights routes require authentication
router.use(authMiddleware);

// Generate project insights
router.get("/:projectId", generateProjectInsights);

module.exports = router;