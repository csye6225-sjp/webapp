require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST, // RDS endpoint (on EC2), or localhost (dev)
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
    // dialectOptions: {
    //   ssl: {
    //     require: true,          // forces SSL connection
    //     rejectUnauthorized: false  // use 'false' if you do not have a CA certificate; not ideal for production
    //   }
    // }
  }
);

module.exports = sequelize;
