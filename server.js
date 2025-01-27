const express = require("express");
const app = express();
const HealthCheck = require("./models/HealthCheck"); // Sequelize model for health_check table

app.use(express.json({ limit: "1kb" })); // Adjust the limit as needed

app.use("/healthz", (req, res, next) => {
    if (req.method === "GET" && Object.keys(req.body || {}).length > 0) {
      // Respond with 400 Bad Request if any payload is present
      return res.status(400).end();
    }
    next();
  });

// Health check endpoint
app.get("/healthz", async (req, res) => {
  try {
    // Insert a record into the health_check table
    await HealthCheck.create({ datetime: new Date() });

    // Set headers to disable caching
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("X-Content-Type-Options", "nosniff");

    // Respond with HTTP 200 OK
    res.status(200).end();
  } catch (error) {
    console.error("Error during health check:", error);

    // Set headers to disable caching
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("X-Content-Type-Options", "nosniff");

    // Respond with HTTP 503 Service Unavailable
    res.status(503).end();
  }
});

// Handle unsupported methods for /healthz
app.all("/healthz", (req, res) => {
  // Set headers to disable caching
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("X-Content-Type-Options", "nosniff");

  // Respond with HTTP 405 Method Not Allowed
  res.status(405).end();
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
