// create-redis-client.js
const { RedisClient } = require('./redis-client');
const { RedisClusterClient } = require('./redis-cluster-client');

function createRedisClient(opts, connectionName, keyPrefix, logger) {
  if (opts.redisType === 'CLUSTER') {
    return new RedisClusterClient(opts, connectionName, logger);
  } else {
    return new RedisClient(opts, connectionName, keyPrefix, logger);
  }
}

module.exports = { createRedisClient };
