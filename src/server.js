require("dotenv").config();
const express = require("express");
const sequelize = require("./config/db");
const fileRoutes = require("./routes/FileRoutes");
const healthCheckRoutes = require("./routes/HealthCheckRoutes");
const { metricsLogger, logger } = require("../middlewares/metricsLogger");

const app = express();

app.use(express.json());
app.use(metricsLogger);


app.use("/v1/file", fileRoutes);
app.use("/v2/file", fileRoutes);

app.use("/healthz", healthCheckRoutes);
app.use("/cicd", healthCheckRoutes);
// Sync DB & start server if not in test
if (process.env.NODE_ENV !== "test") {
  (async () => {
    try {
      await sequelize.sync();
      logger.info("DB synced!");
      const PORT = process.env.PORT || 8080;
      app.listen(PORT, "0.0.0.0", () => {
        logger.info(`Server running on port ${PORT}`);
      });
    } catch (err) {
      logger.error("DB sync error:", err);
      process.exit(1);
    }
  })();
}
module.exports = app;
