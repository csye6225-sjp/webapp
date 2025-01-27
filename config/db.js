const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("mydatabase", "myuser", "mypassword", {
  host: "localhost",
  port: 5433, 
  dialect: "postgres",
  logging: false, 
});

module.exports = sequelize;
