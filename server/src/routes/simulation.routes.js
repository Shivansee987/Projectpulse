
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");

const {
  simulateTask,
  getProjectSimulationHistory,
} = require("../controllers/simulation.controller");

// All simulation routes require authentication
router.use(authMiddleware);

// Get simulation history for a project
router.get("/project/:projectId", getProjectSimulationHistory);

// Run What-If Simulation
router.post("/:taskId", simulateTask);

module.exports = router;