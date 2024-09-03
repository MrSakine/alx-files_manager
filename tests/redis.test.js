/* eslint-disable no-undef */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/prefer-expect-assertions */
const { expect } = require('chai');
const redisClient = require('../utils/redis');

describe('redisClient', () => {
  before(async () => {
    // Ensure Redis is alive before running tests
    const alive = await redisClient.isAlive();
    if (!alive) {
      throw new Error('Redis is not running');
    }
  });

  after(async () => {
    await redisClient.del('key');
  });

  it('should connect to Redis', async () => {
    const alive = await redisClient.isAlive();
    // eslint-disable-next-line no-unused-expressions
    expect(alive).to.be.true;
  });

  it('should set and get keys correctly', async () => {
    await redisClient.set('key', 'value', 86400);
    const value = await redisClient.get('key');
    expect(value).to.equal('value');
  });
});
