const { Sequelize } = require('sequelize');

// Initialize Sequelize
const sequelize = new Sequelize('mydatabase', 'myuser', 'mypassword', {
    host: 'localhost',
    port: 5433, // Use the mapped port
    dialect: 'postgres',
});

module.exports = sequelize;
