import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { VectorStore } from '../../src/ai/vector.db.ts';
import { ConfigService } from '../../src/config/index.ts';
import {
  createTestClient,
  cleanupTestIndex,
  TEST_INDEX,
  TEST_PREFIX,
  REDIS_URL,
} from './setup.ts';

const DIM = 4;

const configService = new ConfigService({
  redis: { url: REDIS_URL, vectorDim: DIM },
});

const randomVector = (dim = DIM): number[] => {
  const v = Array.from({ length: dim }, () => Math.random());
  const magnitude = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
  return v.map((x) => x / magnitude);
};

let testClient: Awaited<ReturnType<typeof createTestClient>>;

beforeAll(async () => {
  testClient = await createTestClient();
});

afterEach(async () => {
  await cleanupTestIndex(testClient, TEST_INDEX, TEST_PREFIX);
});

afterAll(() => {
  testClient.destroy();
});

describe('VectorStore integration - insert & query', () => {
  it('inserts a vector and retrieves it via query', async () => {
    const store = await VectorStore({
      indexName: TEST_INDEX,
      prefix: TEST_PREFIX,
      vectorDim: DIM,
      configService,
    });

    const vector = randomVector();
    await store.insert({ id: 'doc1', vector });

    const result = await store.query({ vector, k: 1 });
    expect(result.total).toBe(1);
    expect(result?.documents[0].id).toBe(`${TEST_PREFIX}doc1`);
  });

  it('returns closest vector first', async () => {
    const store = await VectorStore({
      indexName: TEST_INDEX,
      prefix: TEST_PREFIX,
      vectorDim: DIM,
      configService,
    });

    const queryVector = [1, 0, 0, 0]
    const closeVector = [0.99, 0.1, 0, 0];
    const farVector = [0, 0, 0, 1];

    await store.insert({ id: 'close', vector: closeVector });
    await store.insert({ id: 'far', vector: farVector });


    const result = await store.query({ vector: queryVector, k: 2 });
    expect(result.documents[0].id).toBe(`${TEST_PREFIX}close`);
  });

  it('respects the k limit', async () => {
    const store = await VectorStore({
      indexName: TEST_INDEX,
      prefix: TEST_PREFIX,
      vectorDim: DIM,
      configService,
    });

    for (let i = 0; i < 5; i++) {
      await store.insert({ id: `doc${i}`, vector: randomVector() });
    }


    const result = await store.query({ vector: randomVector(), k: 3 });
    expect(result?.documents.length).toBeLessThanOrEqual(3);
  });

});

describe('VectorStore integration - tag filtering', () => {
  it('filters results by a single tag', async () => {
    const store = await VectorStore({
      indexName: TEST_INDEX,
      prefix: TEST_PREFIX,
      vectorDim: DIM,
      tags: ['type'],
      configService,
    });

    const vector = randomVector();
    await store.insert({ id: 'article1', vector, metadata: { type: 'article' } });
    await store.insert({ id: 'video1', vector, metadata: { type: 'video' } });


    const result = await store.query({
      vector,
      k: 5,
      filter: { type: 'article' },
    });

    expect(result.documents.every((d) => d.value.type === 'article')).toBe(true);
  });

  it('returns all results when no filter is applied', async () => {
    const store = await VectorStore({
      indexName: TEST_INDEX,
      prefix: TEST_PREFIX,
      vectorDim: DIM,
      tags: ['type'],
      configService,
    });

    const vector = randomVector();
    await store.insert({ id: 'doc1', vector, metadata: { type: 'article' } });
    await store.insert({ id: 'doc2', vector, metadata: { type: 'video' } });


    const result = await store.query({ vector, k: 5 });
    expect(result.total).toBe(2);
  });
});

describe('VectorStore integration - error handling', () => {
  it('throws on insert with wrong vector dimension', async () => {
    const store = await VectorStore({
      indexName: TEST_INDEX,
      prefix: TEST_PREFIX,
      vectorDim: DIM,
      configService,
    });

    await expect(
      store.insert({ id: 'bad', vector: [0.1, 0.2] }),
    ).rejects.toThrow(`Invalid vector length: expected ${DIM}`);
  });
});