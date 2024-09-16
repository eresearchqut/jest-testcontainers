const redis = require('redis');

describe('redis example suite', () => {

  const {__TESTCONTAINERS_REDIS_IP__: redisIp, __TESTCONTAINERS_REDIS_PORT_6379__: redisPort, __TESTCONTAINERS_REDIS_NAME__: redisName} = global as any;
  const redisClient = redis.createClient({
    url: `redis://${redisIp}:${redisPort}`
  });

  it("should have container details", async() => {
    expect(redisName).toBeDefined();
    expect(redisPort).toBeDefined();
    expect(redisIp).toBeDefined();
    expect(redisClient).toBeDefined();
  });

  beforeAll(async () => {
    await redisClient.connect();
  });

  afterAll(async () => {
    await redisClient.quit();
  });


  it('should write correctly', async () => {

    // Act
    const setResult = await redisClient.set('test', 73);

    // Assert
    expect(setResult).toEqual('OK');
  });

  it('should read the written value correctly', async () => {

    // Act
    const getResult = await redisClient.get('test');

    // Assert
    expect(getResult).toEqual('73');
  });
});
