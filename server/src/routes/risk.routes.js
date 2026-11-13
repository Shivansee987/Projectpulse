
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const {
  analyzeProjectRisk,
} = require("../controllers/risk.controller");

// All risk routes require authentication
router.use(authMiddleware);

// Analyze project risks
router.get("/:projectId", analyzeProjectRisk);

module.exports = router;