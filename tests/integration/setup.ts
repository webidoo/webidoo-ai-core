import { createClient } from 'redis';

const TEST_INDEX = 'test_integration_index';
const TEST_PREFIX = 'test:integration:';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Creates a raw Redis client for setup/teardown operations.
 * Separate from the one VectorStore manages internally.
 */
export const createTestClient = async () => {
  const client = createClient({ url: REDIS_URL });
  await client.connect();
  return client;
};

/**
 * Drops the test index and all associated keys.
 * Call in afterEach/afterAll to keep tests isolated.
 */
export const cleanupTestIndex = async (
  client: Awaited<ReturnType<typeof createTestClient>>,
  indexName = TEST_INDEX,
  prefix = TEST_PREFIX,
) => {
  // Drop the index (ignore error if it doesn't exist)
  try {
    await client.ft.dropIndex(indexName);
  } catch {}

  // Delete all keys with the test prefix
  const keys = await client.keys(`${prefix}*`);
  if (keys.length > 0) {
    await client.del(keys);
  }
};

export { TEST_INDEX, TEST_PREFIX, REDIS_URL };