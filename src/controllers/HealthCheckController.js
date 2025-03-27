const { logger } = require("../../middlewares/metricsLogger");
const HealthCheck = require("../models/HealthCheck");

const healthCheckHandler = async (req, res) => {
  try {
    // Reject HEAD requests (handled separately in unsupportedMethodHandler)
    if (req.method === "HEAD") {
      logger.warn("HEAD request to /healthz not allowed");
      return res.status(405).end();
    }
    if (Object.keys(req.query || {}).length > 0) {
      logger.warn("Health check request with query parameters");
      return res.status(400).end();
    }
    if (req.headers["content-type"] && req.headers["content-type"] !== "application/json") {
      logger.warn("Health check request with non-JSON content type");
      return res.status(400).end();
    }
    if (Object.keys(req.body || {}).length > 0) {
      logger.warn("Health check request with payload");
      return res.status(400).end();
    }

    // Perform the health check by inserting into the DB
    await HealthCheck.create({ datetime: new Date().toISOString() });
    logger.info("Health check succeeded");

    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("X-Content-Type-Options", "nosniff");

    res.status(200).end();
  } catch (error) {
    logger.error(`Error during health check: ${error}`);
    res.status(503).end();
  }
};

const unsupportedMethodHandler = (req, res) => {
  logger.warn(`Unsupported method ${req.method} on /healthz`);
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("X-Content-Type-Options", "nosniff");
  res.status(405).end();
};

module.exports = {
  healthCheckHandler,
  unsupportedMethodHandler,
};
