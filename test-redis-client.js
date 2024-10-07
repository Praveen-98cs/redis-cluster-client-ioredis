// test-redis-client.js
const { createRedisClient } = require('./create-redis-client');
const { createDefaultRedisClientLogger } = require('./default-redis-logger');

async function testRedisClusterClient() {
  const redisConfig = {
    redisType: 'CLUSTER',
    password: '', // empty string
    tls: false,
    redisURLs: [
      '127.0.0.1:7001',
      '127.0.0.1:7002',
      '127.0.0.1:7003',
      '127.0.0.1:7004',
      '127.0.0.1:7005',
      '127.0.0.1:7006',
    ],
    clusterOptions: {
      enableReadyCheck: true,
      clusterRetryStrategy: (times) => {
        const delay = Math.min(100 + times * 2, 2000);
        return delay;
      },
    },
  };

  const logger = createDefaultRedisClientLogger();

  const redisClient = createRedisClient(redisConfig, 'my-cluster-connection', undefined, logger);

  try {
    await redisClient.waitUntilConnected();
    console.log('Connected to Redis Cluster.');

    // Set a key
    await redisClient.set('test_key', 'Hello, Redis Cluster!');
    logger.info('Key "test_key" set.');

    // Get the key
    const value = await redisClient.get('test_key');
    console.log('Retrieved value:', value);

    // Healthcheck
    await redisClient.healthcheck();
    console.log('Healthcheck passed.');

    // Close the client
    await redisClient.quit();
    console.log('Redis client connection closed.');
  } catch (err) {
    console.error('Error occurred:', err);
  }
}

testRedisClusterClient();
