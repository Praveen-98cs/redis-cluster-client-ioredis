// redis-cluster-client.js
const { Cluster } = require('ioredis');
const { extractErrorMsg } = require('./extract-error-msg');
const { createDefaultRedisClientLogger } = require('./default-redis-logger');

class RedisClusterClient extends Cluster {
  constructor(opts, connectionName, logger) {
    if (opts.redisType !== 'CLUSTER') {
      throw new Error('RedisClusterClient expects redisType to be "CLUSTER".');
    }
    if (!opts.redisURLs || opts.redisURLs.length === 0) {
      throw new Error('Cluster Redis requires "redisURLs" to be specified.');
    }

    const log = logger || createDefaultRedisClientLogger();

    // Parse redisURLs into cluster nodes
    const nodes = opts.redisURLs.map((url) => {
      const [host, portStr] = url.split(':');
      return {
        host,
        port: parseInt(portStr, 10),
      };
    });

    super(nodes, {
      ...opts.clusterOptions,
      redisOptions: {
        connectionName,
        password: opts.password,
        tls: opts.tls ? {} : undefined,
        showFriendlyErrorStack: true,
      },
    });

    this.log = log.child({ connectionName });

    // Event handlers
    this.on('error', (err) => {
      this.log.error('[RedisCluster]:event:error', { connectionName, err: extractErrorMsg(err) });
    });

    this.on('connect', () => {
      this.log.info('[RedisCluster]:event:connect', { connectionName });
    });

    this.on('ready', () => {
      this.log.info('[RedisCluster]:event:ready', { connectionName });
    });
  }

  async waitUntilConnected() {
    if (this.status === 'ready') {
      return;
    }
    const readyPromise = new Promise((resolve) => {
      this.once('ready', resolve);
    });
    try {
      await this.connect();
    } catch (err) {
      this.log.error('[RedisCluster] waitUntilConnected: failed on initial connection, retrying...', {
        err: extractErrorMsg(err),
      });
      const timeOutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('[RedisCluster] waitUntilConnected: failed after 30s'));
        }, 30000);
      });
      await Promise.race([readyPromise, timeOutPromise]);
    }
  }

  async healthcheck() {
    const pingRes = await this.ping();
    if (pingRes !== 'PONG') {
      await this.connect();
      const pingResRetry = await this.ping();
      if (pingResRetry !== 'PONG') {
        throw new Error('[RedisCluster] healthcheck (ping) failed after two attempts');
      }
    }
  }

  getClient() {
    return this;
  }
}

module.exports = { RedisClusterClient };
