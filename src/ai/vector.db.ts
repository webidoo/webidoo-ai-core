import {
	createClient,
	SCHEMA_FIELD_TYPE,
	SCHEMA_VECTOR_FIELD_ALGORITHM,
} from "redis";

type VectorStoreOptions = {
	indexName: string;
	prefix: string;
	vectorDim: number;
	tags?: string[];
};

type InsertOptions = {
	id: string;
	vector: number[];
	metadata?: Record<string, string>;
};

type QueryOptions = {
	vector: number[];
	k?: number;
	filter?: Record<string, string>;
};

export const VectorStore = async ({
	indexName,
	prefix,
	vectorDim,
	tags,
}: VectorStoreOptions) => {
	const client = createClient({ url: process.env.REDIS_URL });
	await client.connect();
	const tagOptions = tags?.reduce(
		(acc, next) => Object.assign(acc, { [next]: { type: "TAG" as const } }),
		{} as Record<string, { type: "TAG" }>,
	);
	try {
		await client.ft.create(
			indexName,
			{
				vector: {
					type: SCHEMA_FIELD_TYPE.VECTOR,
					ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.HNSW,
					TYPE: "FLOAT32",
					DIM: vectorDim,
					DISTANCE_METRIC: "COSINE",
				},
				...tagOptions,
			},
			{
				ON: "HASH",
				PREFIX: prefix,
			},
		);
	} catch (e) {}

	const insert = async ({ id, vector, metadata = {} }: InsertOptions) => {
		if (!Array.isArray(vector) || vector.length !== vectorDim) {
			throw new Error(
				`Invalid vector length: expected ${vectorDim}, received ${vector.length}`,
			);
		}
		const buf = Buffer.from(new Float32Array(vector).buffer);
		await client.hSet(`${prefix}${id}`, {
			vector: buf,
			...metadata,
		});
	};
	const query = async ({ vector, k = 5, filter }: QueryOptions) => {
		const buf = Buffer.from(new Float32Array(vector).buffer);

		const filterExpr = filter
			? Object.entries(filter)
					.map(([key, val]) => `@${key}:{${val}}`)
					.join(" ")
			: "*";

		const queryStr = `${filterExpr}=>[KNN ${k} @vector $vec_param AS score]`;

		const res = await client.ft.search(indexName, queryStr, {
			DIALECT: 2,
			PARAMS: {
				vec_param: buf,
			},
		});
		return res;
	};

	return {
		insert,
		query,
	};
};
