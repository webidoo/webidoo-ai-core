import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock redis before importing VectorStore ---
const mockHSet = vi.fn().mockResolvedValue(1);
const mockFtSearch = vi.fn().mockResolvedValue({ total: 0, documents: [] });
const mockFtCreate = vi.fn().mockResolvedValue('OK');
const mockConnect = vi.fn().mockResolvedValue(undefined);

vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    connect: mockConnect,
    hSet: mockHSet,
    ft: {
      create: mockFtCreate,
      search: mockFtSearch,
    },
  })),
  SCHEMA_FIELD_TYPE: { VECTOR: 'VECTOR' },
  SCHEMA_VECTOR_FIELD_ALGORITHM: { HNSW: 'HNSW' },
}));

import { VectorStore } from '../../src/ai/vector.db';
import { ConfigService } from '../../src/config';

// A valid 4-dimensional vector for testing
const DIM = 4;
const mockVector = [0.1, 0.2, 0.3, 0.4];

const makeStore = (overrides = {}) =>
  VectorStore({
    indexName: 'test_index',
    prefix: 'test:',
    vectorDim: DIM,
    configService: new ConfigService({
      redis: { url: 'redis://localhost:6379', vectorDim: DIM },
    }),
    ...overrides,
  });

describe('VectorStore - initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: index creation succeeds
    mockFtCreate.mockResolvedValue('OK');
  });

  it('connects to Redis on creation', async () => {
    await makeStore();
    expect(mockConnect).toHaveBeenCalledOnce();
  });

  it('throws if no vectorDim is provided in options or config', async () => {
    await expect(
      VectorStore({
        indexName: 'test_index',
        prefix: 'test:',
        configService: new ConfigService({
          redis: { url: 'redis://localhost:6379', vectorDim: undefined },
        }),
      }),
    ).rejects.toThrow('Vector dimension is required');
  });

  it('falls back to vectorDim from config if not passed in options', async () => {
    await expect(
      VectorStore({
        indexName: 'test_index',
        prefix: 'test:',
        configService: new ConfigService({
          redis: { url: 'redis://localhost:6379', vectorDim: DIM },
        }),
      }),
    ).resolves.toBeDefined();
  });
});

describe('VectorStore - insert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores the vector as a Float32Array buffer', async () => {
    const store = await makeStore();
    await store.insert({ id: 'doc1', vector: mockVector });

    const expectedBuf = Buffer.from(new Float32Array(mockVector).buffer);
    expect(mockHSet).toHaveBeenCalledWith('test:doc1', {
      vector: expectedBuf,
    });
  });

  it('uses the correct key format (prefix + id)', async () => {
    const store = await makeStore({ prefix: 'myprefix:' });
    await store.insert({ id: 'abc', vector: mockVector });

    expect(mockHSet).toHaveBeenCalledWith(
      'myprefix:abc',
      expect.any(Object),
    );
  });

  it('includes metadata in the hSet call', async () => {
    const store = await makeStore();
    await store.insert({
      id: 'doc1',
      vector: mockVector,
      metadata: { source: 'wiki', type: 'article' },
    });

    expect(mockHSet).toHaveBeenCalledWith('test:doc1', {
      vector: expect.any(Buffer),
      source: 'wiki',
      type: 'article',
    });
  });

  it('works with empty metadata', async () => {
    const store = await makeStore();
    await expect(
      store.insert({ id: 'doc1', vector: mockVector, metadata: {} }),
    ).resolves.not.toThrow();
  });

  it('throws if vector has wrong dimension', async () => {
    const store = await makeStore();
    await expect(
      store.insert({ id: 'doc1', vector: [0.1, 0.2] }),
    ).rejects.toThrow(`Invalid vector length: expected ${DIM}, received 2`);
  });

  it('throws if vector is not an array', async () => {
    const store = await makeStore();
    await expect(
      store.insert({ id: 'doc1', vector: 'not-an-array' as unknown as number[] }),
    ).rejects.toThrow('Invalid vector length');
  });
});

describe('VectorStore - query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFtSearch.mockResolvedValue({ total: 0, documents: [] });
  });

  it('passes the vector as a Float32Array buffer param', async () => {
    const store = await makeStore();
    await store.query({ vector: mockVector });

    const expectedBuf = Buffer.from(new Float32Array(mockVector).buffer);
    expect(mockFtSearch).toHaveBeenCalledWith(
      'test_index',
      expect.any(String),
      expect.objectContaining({
        PARAMS: { vec_param: expectedBuf },
      }),
    );
  });

  it('uses k=5 by default', async () => {
    const store = await makeStore();
    await store.query({ vector: mockVector });

    expect(mockFtSearch).toHaveBeenCalledWith(
      'test_index',
      expect.stringContaining('KNN 5'),
      expect.any(Object),
    );
  });

  it('uses the provided k value', async () => {
    const store = await makeStore();
    await store.query({ vector: mockVector, k: 10 });

    expect(mockFtSearch).toHaveBeenCalledWith(
      'test_index',
      expect.stringContaining('KNN 10'),
      expect.any(Object),
    );
  });

  it('uses "*" as filter expression when no filter is provided', async () => {
    const store = await makeStore();
    await store.query({ vector: mockVector });

    expect(mockFtSearch).toHaveBeenCalledWith(
      'test_index',
      expect.stringMatching(/^\*=>/),
      expect.any(Object),
    );
  });

  it('builds a tag filter expression from the filter object', async () => {
    const store = await makeStore();
    await store.query({ vector: mockVector, filter: { type: 'article' } });

    expect(mockFtSearch).toHaveBeenCalledWith(
      'test_index',
      expect.stringContaining('@type:{article}'),
      expect.any(Object),
    );
  });

  it('combines multiple filters with a space (AND in RediSearch)', async () => {
    const store = await makeStore();
    await store.query({
      vector: mockVector,
      filter: { type: 'article', source: 'wiki' },
    });

    const queryArg = mockFtSearch.mock.calls[0][1] as string;
    expect(queryArg).toContain('@type:{article}');
    expect(queryArg).toContain('@source:{wiki}');
  });

  it('uses DIALECT 2', async () => {
    const store = await makeStore();
    await store.query({ vector: mockVector });

    expect(mockFtSearch).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ DIALECT: 2 }),
    );
  });
});