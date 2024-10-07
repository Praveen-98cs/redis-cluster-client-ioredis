// test-redis-client.js
const { RedisClient } = require('./redis-client');  // Import the RedisClient you created
const { createDefaultRedisClientLogger } = require('./default-redis-logger');

async function testStandaloneRedisClient() {
  const redisConfig = {
    redisType: 'STANDALONE', // Since it's a standalone instance
    host: '127.0.0.1', // Localhost
    port: 6379, // Default Redis port
    password: '', // Empty password
    tls: false, // No TLS for this setup
  };

  const logger = createDefaultRedisClientLogger();  // Create logger (optional)

  // Create a new RedisClient instance with the standalone configuration
  const redisClient = new RedisClient(redisConfig, 'my-standalone-connection', undefined, logger);

  try {
    // Wait until the client connects
    await redisClient.waitUntilConnected();
    console.log('Connected to Redis Standalone.');

    // Adding 50 simple keys to Redis (test1 -> value1, test2 -> value2, etc.)
    for (let i = 1; i <= 50; i++) {
      const key = `test${i}`;
      const value = `value${i}`;
      await redisClient.set(key, value);
      console.log(`Set ${key} -> ${value}`);
    }
    logger.info('50 keys added to Redis.');

    // Healthcheck to ensure Redis is responsive
    await redisClient.healthcheck();
    console.log('Healthcheck passed.');

    // Close the client connection
    await redisClient.quit();
    console.log('Redis client connection closed.');
  } catch (err) {
    console.error('Error occurred:', err);
  }
}

testStandaloneRedisClient();
