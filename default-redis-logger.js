// default-redis-logger.js
const { createLogger, format, transports } = require('winston');

function createDefaultRedisClientLogger() {
  return createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp(),
      format.splat(),
      format.simple(),
    ),
    transports: [new transports.Console()],
  });
}

module.exports = { createDefaultRedisClientLogger };
