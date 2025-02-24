const express = require("express");
const router = express.Router();
const {
  healthCheckHandler,
  unsupportedMethodHandler,
} = require("../controllers/HealthCheckController");

router.get("/", healthCheckHandler);
router.all("/", unsupportedMethodHandler);

module.exports = router;
