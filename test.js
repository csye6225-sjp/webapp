const sequelize = require('./db');
const HealthCheck = require('./models/HealthCheck');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection established successfully.');

        // Sync the HealthCheck model (creates the table if not exists)
        await HealthCheck.sync({ alter: true });
        console.log('HealthCheck table is ready.');

        // Insert a sample record
        await HealthCheck.create({ datetime: new Date() });
        console.log('Inserted a health check record.');

        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
})();
