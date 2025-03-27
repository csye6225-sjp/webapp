// src/middlewares/metricsLogger.js
const { createLogger, format, transports } = require('winston');
const StatsD = require('node-statsd');

// Configure Winston logger with UTC timestamps explicitly
const logger = createLogger({
  level: 'info',
  format: format.combine(
    // Ensure timestamps are in UTC
    format.timestamp({ format: () => new Date().toISOString() }),
    format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} ${level.toUpperCase()}: ${stack || message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "/var/log/webapp.log" })
  ]
});

// Create a StatsD client (for custom metrics)
const statsdClient = new StatsD({
  host: process.env.STATSD_HOST || 'localhost',
  port: process.env.STATSD_PORT || 8125,
});

// Middleware to log each request and collect metrics
function metricsLogger(req, res, next) {
  const startTime = Date.now();
  logger.info(`Incoming ${req.method} ${req.originalUrl}`);
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`Completed ${req.method} ${req.originalUrl} with status ${res.statusCode} in ${duration}ms`);
    
    // Build a metric name (sanitize URL)
    const metricName = `api${req.method}.${req.originalUrl.replace(/\//g, '_')}`;
    statsdClient.increment(`${metricName}.count`);
    statsdClient.timing(`${metricName}.timer`, duration);
  });
  
  next();
}

module.exports = { logger, metricsLogger, statsdClient };
