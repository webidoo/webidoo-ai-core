# webidoo-ai-core

A comprehensive TypeScript library for AI applications, providing seamless integration with OpenAI APIs and Redis-powered vector storage for advanced inference and RAG (Retrieval-Augmented Generation) workflows.

## Features

- `InferenceModel`: a wrapper on top of OpenAI API with support for tool calls and streaming.
- `VectorStore`: an interface for creating, populating, and querying a Redis vector index.
- `ConfigService`: a service for managing configuration parameters.

## Installation

```bash
npm install @webidoo-eng/webidoo-ai-core
```

## Quick Start

```typescript
import { InferenceModel, VectorStore, ConfigService } from '@webidoo-eng/webidoo-ai-core';

// Initialize with configuration
const config = new ConfigService({
  openai: { apiKey: 'your-api-key' },
  redis: { url: 'redis://localhost:6379' }
});

// Create AI model
const model = new InferenceModel(config);

// Create vector store (async factory function)
const vectorStore = await VectorStore({
  indexName: 'my_index',
  prefix: 'v:',
  configService: config,
});
```

## Requirements

- Node.js
- Redis Stack with RediSearch support

### Environment Variables (Optional)

- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_ORG_ID` - OpenAI organization ID (optional)
- `OPENAI_BASE_URL` - Custom OpenAI API endpoint (optional)
- `REDIS_URL` - Redis connection URL (default: `redis://localhost:6379`)

---

## `ConfigService`

The main class for managing configuration.

### Constructor

```ts
new ConfigService(config?: Partial<WebidooConfig>)
```

- `config`: optional partial configuration that overrides default values

### Methods

- `getConfig()`: returns the full configuration
- `getOpenAIConfig()`: returns only the OpenAI configuration
- `getRedisConfig()`: returns only the Redis configuration
- `updateConfig(config: Partial<WebidooConfig>)`: updates the configuration
- `validate()`: checks that required parameters are present

---

## `InferenceModel`

Class for managing interactions with the OpenAI model.

### Available Methods

#### `stream({ model, messages, temperature })`

Executes a streaming completion.

**Parameters:**

- `model`: model name (e.g. `gpt-4-0613`)
- `messages`: array of messages in `TMessageInput` format
- `temperature`: optional

**Returns:**

- `ReadableStream` of the streaming response

---

#### `invoke({ model, messages, tools, temperature, forceTool })`

Executes a synchronous completion with tool call support.

**Parameters:**

- `model`: model name
- `messages`: array of messages
- `tools`: array of tools with `handler`
- `forceTool`: if true, forces tool usage
- `temperature`: optional

**Returns:**

- Array of `TMessage` (assistant responses + tool responses)

---

## `VectorStore`

Async factory function that initializes a Redis vector index.

### Parameters

- `indexName`: index name
- `prefix`: Redis hash key prefix
- `vectorDim`: vector dimension (optional, falls back to config)
- `tags`: optional array of tag fields (used as filters)
- `configService`: optional `ConfigService` instance

### Returned Methods

#### `insert({ id, vector, metadata })`

Inserts a vector with metadata.

**Parameters:**

- `id`: unique key
- `vector`: `number[]` array of size `vectorDim`
- `metadata`: optional, `Record<string, string>`

---

#### `query({ vector, k, filter })`

Performs a vector query with optional filtering.

**Parameters:**

- `vector`: `number[]` array
- `k`: number of results to return (default 5)
- `filter`: optional tag filters

**Returns:**

- Results from `client.ft.search`

---

## Usage Examples

### Default configuration

```ts
// Uses environment variables for configuration
const configService = new ConfigService();

// Create InferenceModel with the configuration
const model = new InferenceModel(configService);
const response = await model.invoke({
  model: 'gpt-4',
  messages: [...],
});

// Create VectorStore with the same configuration
const store = await VectorStore({
  indexName: 'my_index',
  prefix: 'v:',
  configService,
  tags: ['type'],
});

await store.insert({
  id: 'item1',
  vector: [...],
  metadata: { type: 'doc' },
});

const result = await store.query({ vector: [...], k: 3 });
```

### Custom configuration

```ts
const configService = new ConfigService({
  openai: {
    apiKey: 'your-api-key',
    baseURL: 'https://custom-openai-endpoint.com',
  },
  redis: {
    url: 'redis://custom-redis:6379',
    vectorDim: 768,
  }
});

const model = new InferenceModel(configService);
const store = await VectorStore({
  indexName: 'custom_index',
  prefix: 'custom:',
  configService,
});
```

### Dynamic configuration update

```ts
const configService = new ConfigService();

configService.updateConfig({
  openai: {
    baseURL: 'https://updated-endpoint.com',
  }
});

const model = new InferenceModel(configService);
```

---

## Full Example: `InferenceModel` with Tools

```ts
import { ConfigService, InferenceModel } from '@webidoo-eng/webidoo-ai-core';

const configService = new ConfigService();
const model = new InferenceModel(configService);

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_time',
      description: 'Returns the current time in ISO format',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
    handler: async ({ name, args }) => {
      return new Date().toISOString();
    },
  },
];

const messages = [
  {
    role: 'user',
    content: [{ type: 'text', text: 'What time is it?' }],
  },
];

const response = await model.invoke({
  model: 'gpt-4-1106-preview',
  messages,
  tools,
  forceTool: false,
});

console.log(response);
```

---

## RAG Example: Retrieval as a Tool

In this example, `retrieve_context` is registered as a tool and queries a Redis vector store. The LLM invokes the tool with an embedding vector and receives relevant documents in return.

### Store setup with ConfigService

```ts
const configService = new ConfigService({
  redis: {
    vectorDim: 1536
  }
});

const store = await VectorStore({
  indexName: 'rag_index',
  prefix: 'doc:',
  configService,
  tags: ['source'],
});
```

### Retrieval tool

```ts
const ragTool = {
  type: 'function',
  function: {
    name: 'retrieve_context',
    description: 'Retrieves the most relevant documents from the knowledge base',
    parameters: {
      type: 'object',
      properties: {
        query_vector: {
          type: 'array',
          items: { type: 'number' },
        },
        k: { type: 'integer' },
      },
      required: ['query_vector'],
    },
  },
  handler: async ({ args }) => {
    const { query_vector, k = 3 } = args as {
      query_vector: number[];
      k?: number;
    };
    const res = await store.query({ vector: query_vector, k });
    return JSON.stringify(res.documents ?? []);
  },
};
```

### Running with `InferenceModel`

```ts
const model = new InferenceModel(configService);

const messages = [
  {
    role: 'user',
    content: [{ type: 'text', text: 'What does the documentation say about configuring authentication?' }],
  },
];

const embedding = [...]; // float array from an external embedding model

const response = await model.invoke({
  model: 'gpt-4-1106-preview',
  messages,
  tools: [ragTool],
  forceTool: true,
});
```

### What happens

The LLM:

1. Sends `query_vector` to the `retrieve_context` tool
2. Receives relevant documents from the Redis vector store
3. Generates the final response using the retrieved content
