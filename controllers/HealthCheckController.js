const HealthCheck = require("../models/HealthCheck");

const healthCheckHandler = async (req, res) => {
  try {
    // Reject HEAD requests (handled separately in unsupportedMethodHandler)
    if (req.method === "HEAD") {
      return res.status(405).end();
    }

    // Reject any query parameters
    if (Object.keys(req.query || {}).length > 0) {
      return res.status(400).end();
    }

    // Reject any payload regardless of content type
    if (req.headers["content-type"] && req.headers["content-type"] !== "application/json") {
      return res.status(400).end();
    }
    
    if (Object.keys(req.body || {}).length > 0) {
      return res.status(400).end();
    }

    // Perform the health check by inserting into the DB
    await HealthCheck.create({ datetime: new Date().toISOString() });

    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("X-Content-Type-Options", "nosniff");

    res.status(200).end();
  } catch (error) {
    console.error("Error during health check:", error);
    res.status(503).end();
  }
};

const unsupportedMethodHandler = (req, res) => {
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("X-Content-Type-Options", "nosniff");
  res.status(405).end();
};

module.exports = {
  healthCheckHandler,
  unsupportedMethodHandler,
};
