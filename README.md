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

// Create AI model and vector store
const model = new InferenceModel(config);
const vectorStore = new VectorStore(config);
```


## Requirements

- Node.js
- Redis Stack con supporto per RediSearch

### Environment Variables (Optional)

- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_ORG_ID` - OpenAI organization ID (optional)
- `OPENAI_BASE_URL` - Custom OpenAI API endpoint (optional)
- `REDIS_URL` - Redis connection URL (default: redis://localhost:6379)

## ConfigService

Features:

- Utilizzare valori di default dalle variabili d'ambiente
- Fornire configurazioni personalizzate
- Aggiornare la configurazione dinamicamente
- Condividere la stessa configurazione tra componenti diverse

### `ConfigService`

Classe principale per la gestione della configurazione.

#### Costruttore

```ts
new ConfigService(config?: Partial<WebidooConfig>)
```

- `config`: configurazione parziale opzionale che sovrascrive i valori di default

#### Metodi

- `getConfig()`: restituisce la configurazione completa
- `getOpenAIConfig()`: restituisce solo la configurazione OpenAI
- `getRedisConfig()`: restituisce solo la configurazione Redis
- `updateConfig(config: Partial<WebidooConfig>)`: aggiorna la configurazione
- `validate()`: verifica che i parametri richiesti siano presenti

---

## `InferenceModel`

Classe per gestire interazioni con il modello OpenAI.

### Metodi

#### `stream({ model, messages, temperature })`

Esegue una completion in streaming.

**Parametri:**
- `model`: nome del modello (es. `gpt-4-0613`)
- `messages`: array di messaggi in formato `TMessageInput`
- `temperature`: opzionale

**Ritorna:**
- `ReadableStream` della risposta in streaming

---

#### `invoke({ model, messages, tools, temperature, forceTool })`

Esegue una completion sincrona con supporto per tool call.

**Parametri:**
- `model`: nome del modello
- `messages`: array di messaggi
- `tools`: array di tool con `handler`
- `forceTool`: se true forza l'uso dei tool
- `temperature`: opzionale

**Ritorna:**
- Array di `TMessage` (risposte assistant + risposte dei tool)

---

## `VectorStore`

Factory asincrona che inizializza un indice Redis per vettori.

### Parametri

- `indexName`: nome dell'indice
- `prefix`: prefisso chiavi hash Redis
- `vectorDim`: dimensione dei vettori
- `tags`: opzionale, array di tag (filtri)

### Metodi restituiti

#### `insert({ id, vector, metadata })`

Inserisce un vettore con metadata.

**Parametri:**
- `id`: chiave univoca
- `vector`: array `number[]` di dimensione `vectorDim`
- `metadata`: opzionale, `Record<string, string>`

---

#### `query({ vector, k, filter })`

Effettua una query vettoriale con filtro opzionale.

**Parametri:**
- `vector`: array `number[]`
- `k`: numero risultati da restituire (default 5)
- `filter`: opzionale, filtri per tag

**Ritorna:**
- Risultati da `client.ft.search`

---

## Esempi d'uso

### Utilizzo con configurazione di default

```ts
// Utilizza le variabili d'ambiente per la configurazione
const configService = new ConfigService();

// Crea un'istanza di InferenceModel con la configurazione
const model = new InferenceModel(configService);
const response = await model.invoke({
  model: 'gpt-4',
  messages: [...],
});

// Crea un VectorStore con la stessa configurazione
const store = await VectorStore({
  indexName: 'my_index',
  prefix: 'v:',
  configService, // Usa la stessa configurazione
  tags: ['type'],
});

await store.insert({
  id: 'item1',
  vector: [...],
  metadata: { type: 'doc' },
});

const result = await store.query({ vector: [...], k: 3 });
```

### Utilizzo con configurazione personalizzata

```ts
// Crea una configurazione personalizzata
const configService = new ConfigService({
  openai: {
    apiKey: 'your-api-key', // Sovrascrive la variabile d'ambiente
    baseURL: 'https://custom-openai-endpoint.com',
  },
  redis: {
    url: 'redis://custom-redis:6379',
    vectorDim: 768, // Dimensione vettori personalizzata
  }
});

// Usa la configurazione personalizzata
const model = new InferenceModel(configService);
const store = await VectorStore({
  indexName: 'custom_index',
  prefix: 'custom:',
  configService,
});
```

### Aggiornamento dinamico della configurazione

```ts
const configService = new ConfigService();

// Aggiorna la configurazione in runtime
configService.updateConfig({
  openai: {
    baseURL: 'https://updated-endpoint.com',
  }
});

// Le nuove istanze useranno la configurazione aggiornata
const model = new InferenceModel(configService);
```

## Esempio completo: `InferenceModel` con tool

```ts
import { ConfigService, InferenceModel } from '@webidoo-eng/webidoo-ai-core';

// Crea un'istanza di ConfigService
const configService = new ConfigService();

// Crea un'istanza di InferenceModel con la configurazione
const model = new InferenceModel(configService);

const tools = [
	{
		type: 'function',
		function: {
			name: 'get_time',
			description: 'Restituisce l\'ora corrente in formato ISO',
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
		content: [
			{
				type: 'text',
				text: 'Che ore sono?',
			},
		],
	},
];

const response = await model.invoke({
	model: 'gpt-4-1106-preview',
	messages,
	tools,
	forceTool: false,
});

console.log(response);

````
## Esempio RAG: recupero come tool

In questo esempio, `retrieve_context` è registrato come tool e interroga uno store vettoriale Redis. L'LLM invoca il tool con un vettore di embedding e riceve in risposta documenti rilevanti.

### Setup dello store con ConfigService

```ts
// Crea un'istanza di ConfigService
const configService = new ConfigService({
  redis: {
    vectorDim: 1536 // Dimensione vettori per embeddings
  }
});

// Crea il VectorStore usando la configurazione
const store = await VectorStore({
  indexName: 'rag_index',
  prefix: 'doc:',
  configService,
  tags: ['source'],
});
````

### Tool di retrieval

```ts
const ragTool = {
	type: 'function',
	function: {
		name: 'retrieve_context',
		description: 'Recupera i documenti più rilevanti dal knowledge base',
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

### Esecuzione con `InferenceModel` e ConfigService

```ts
// Usa la stessa istanza di ConfigService
const model = new InferenceModel(configService);

const messages = [
	{
		role: 'user',
		content: [
			{
				type: 'text',
				text: 'Cosa dice la documentazione su come configurare l’autenticazione?',
			},
		],
	},
];

const embedding = [...]; // array<float> da modello embedding esterno

const response = await model.invoke({
	model: 'gpt-4-1106-preview',
	messages,
	tools: [ragTool],
	forceTool: true,
});
```

### Risultato

L'LLM:

1. Invia `query_vector` al tool `retrieve_context`
2. Ottiene documenti rilevanti dal Redis vector store
3. Genera la risposta finale usando il contenuto ricevuto

