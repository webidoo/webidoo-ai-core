import { VectorStore } from "./ai/vector.db";

const main = async () => {
	const vectorStore = await VectorStore({ indexName: "test2", vectorDim: 150 });
	const vector = new Array(150).fill(0).map((_, i) => Math.random());

	const res = await vectorStore.query({ vector });
	console.dir(res, { depth: null });
};
main();
