const sequelize = require("./config/db");
const express = require("express");
const healthCheckRoutes = require("./routes/HealthCheckRoutes");

const app = express();
app.use(express.json({ limit: "1kb" })); 


app.use("/healthz", healthCheckRoutes);

// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

(async () => {
    try {
      await sequelize.sync({ alter: true }); 
      console.log("Database bootstrapped successfully!");
  
      
      const PORT = process.env.PORT || 8080;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    } catch (error) {
      console.error("Error bootstrapping the database:", error);
      process.exit(1); 
    }
  })();