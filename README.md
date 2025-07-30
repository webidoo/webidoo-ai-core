# InferenceModel & VectorStore

Questo modulo espone due componenti distinte:

- `InferenceModel`: un wrapper su OpenAI API con supporto per tool calls e streaming.
- `VectorStore`: un'interfaccia per creare, popolare e interrogare un indice vettoriale Redis.

## Requisiti

- Node.js
- Redis Stack con supporto per RediSearch
- Variabili d'ambiente:
  - `REDIS_URL`: URL di connessione a Redis
  - OpenAI non richiede token esplicito nel costruttore se configurato tramite env (`OPENAI_API_KEY`)

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

## Esempio d'uso

```ts
const model = new InferenceModel();
const response = await model.invoke({
	model: 'gpt-4',
	messages: [...],
});

const store = await VectorStore({
	indexName: 'my_index',
	prefix: 'v:',
	vectorDim: 1536,
	tags: ['type'],
});
await store.insert({
	id: 'item1',
	vector: [...],
	metadata: { type: 'doc' },
});
const result = await store.query({ vector: [...], k: 3 });
```

## Esempio completo: `InferenceModel` con tool

```ts
import { InferenceModel } from './InferenceModel';

const model = new InferenceModel();

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

### Setup dello store

```ts
const store = await VectorStore({
	indexName: 'rag_index',
	prefix: 'doc:',
	vectorDim: 1536,
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

### Esecuzione con `InferenceModel`

```ts
const model = new InferenceModel();

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

