// redis-client.js
const Redis = require('ioredis');
const { extractErrorMsg } = require('./extract-error-msg');
const { createDefaultRedisClientLogger } = require('./default-redis-logger');

class RedisClient extends Redis {
  constructor(opts, connectionName, keyPrefix, logger) {
    if (opts.redisType !== 'STANDALONE') {
      throw new Error('RedisClient expects redisType to be "STANDALONE".');
    }
    if (!opts.host || !opts.port) {
      throw new Error('Standalone Redis requires "host" and "port" to be specified.');
    }

    const log = logger || createDefaultRedisClientLogger();

    super({
      connectionName,
      host: opts.host,
      port: opts.port,
      password: opts.password,
      tls: opts.tls ? {} : undefined,
      db: opts.db,
      keyPrefix,
      showFriendlyErrorStack: true,
    });

    this.log = log.child({ connectionName });

    // Event handlers
    this.on('error', (err) => {
      this.log.error('[Redis]:event:error', { connectionName, err: extractErrorMsg(err) });
    });

    this.on('connect', () => {
      this.log.info('[Redis]:event:connect', { connectionName });
    });

    this.on('ready', () => {
      this.log.info('[Redis]:event:ready', { connectionName });
    });
  }

  async waitUntilConnected() {
    if (this.status === 'ready') {
      return;
    }
  
    if (this.status === 'connecting') {
      // Already connecting, just wait for 'ready' event
    } else {
      try {
        await this.connect();
      } catch (err) {
        this.log.error('[RedisCluster] waitUntilConnected: failed on initial connection, retrying...', {
          err: extractErrorMsg(err),
        });
      }
    }
  
    const readyPromise = new Promise((resolve, reject) => {
      this.once('ready', resolve);
      this.once('error', reject);
    });
  
    const timeOutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('[RedisCluster] waitUntilConnected: failed after 30s'));
      }, 30000);
    });
  
    await Promise.race([readyPromise, timeOutPromise]);
  }
  

  async healthcheck() {
    const pingRes = await this.ping();
    if (pingRes !== 'PONG') {
      await this.connect();
      const pingResRetry = await this.ping();
      if (pingResRetry !== 'PONG') {
        throw new Error('[Redis] healthcheck (ping) failed after two attempts');
      }
    }
  }

  getClient() {
    return this;
  }
}

module.exports = { RedisClient };
