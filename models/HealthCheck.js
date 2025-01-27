const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize("mydatabase", "myuser", "mypassword", {
  host: "localhost",
  port: 5433,
  dialect: "postgres",
});

// Define the HealthCheck model
const HealthCheck = sequelize.define(
  "HealthCheck",
  {
    check_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    datetime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "health_check",
    timestamps: false,
  }
);

module.exports = HealthCheck;
