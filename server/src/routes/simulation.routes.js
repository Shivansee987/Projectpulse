
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const {
  simulateTask,
} = require("../controllers/simulation.controller");

// All simulation routes require authentication
router.use(authMiddleware);

// Run What-If Simulation
router.post("/:taskId", simulateTask);

module.exports = router;