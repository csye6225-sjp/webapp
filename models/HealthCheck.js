const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

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
