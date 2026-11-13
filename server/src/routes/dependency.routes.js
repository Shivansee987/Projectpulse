
const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");

const {
  createDependency,
  getDependencies,
  deleteDependency,
} = require("../controllers/dependency.controller");

// All dependency routes require authentication
router.use(authMiddleware);

router.post("/", createDependency);
router.get("/:taskId", getDependencies);
router.delete("/:id", deleteDependency);

module.exports = router;
