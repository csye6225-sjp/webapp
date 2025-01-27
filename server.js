const express = require("express");
const healthCheckRoutes = require("./routes/HealthCheckRoutes");

const app = express();
app.use(express.json({ limit: "1kb" })); 


app.use("/healthz", healthCheckRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
