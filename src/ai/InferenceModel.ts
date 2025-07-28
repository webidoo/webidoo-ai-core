import OpenAI from "openai";
import type {
	ChatCompletionCreateParamsNonStreaming,
	ChatCompletionCreateParamsStreaming,
	ChatCompletionTool,
} from "openai/resources/chat";

import {
	MessageRoleEnum,
	MessageTypeEnum,
	type TMessage,
	type TMessageInput,
} from "./Message";
export class InferenceModel {
	public client: OpenAI;
	constructor() {
		this.client = new OpenAI({});
	}
	stream = async (arg: {
		model: string;
		messages: TMessageInput[];
		temperature?: number;
	}) => {
		const result = await this.client.chat.completions.create({
			...arg,
			stream: true,
		} as ChatCompletionCreateParamsStreaming);

		return result;
	};
	invoke = async ({
		forceTool,
		...arg
	}: {
		model: string;
		messages: TMessageInput[];
		tools?: (ChatCompletionTool & {
			handler: (arg: {
				name: string;
				args: Record<string, unknown>;
			}) => string | Promise<string>;
		})[];
		temperature?: number;
		forceTool?: boolean;
	}): Promise<TMessage[]> => {
		const result = await this.client.chat.completions.create({
			...arg,
			parallel_tool_calls: arg.tools?.length ? true : undefined,
			tool_choice: arg.tools ? (forceTool ? "required" : "auto") : undefined,
		} as ChatCompletionCreateParamsNonStreaming);
		const toolMessages: TMessage[] = [];
		for (const toolCall of result.choices[0].message.tool_calls || []) {
			const tool = arg.tools?.find(
				(t) => t.function.name === toolCall.function.name,
			);
			if (!tool) {
				continue;
			}
			const toolResult = await tool.handler({
				name: toolCall.function.name,
				args: JSON.parse(toolCall.function.arguments),
			});
			toolMessages.push({
				content: [
					{
						type: MessageTypeEnum.TEXT as const,
						text: "",
					},
				],
				tool_calls: [toolCall],
				role: MessageRoleEnum.ASSISTANT,
			});
			toolMessages.push({
				content: [
					{
						type: MessageTypeEnum.TEXT as const,
						text: toolResult,
					},
				],

				tool_call_id: toolCall.id,
				role: MessageRoleEnum.TOOL,
			});
		}
		return [
			...toolMessages,
			{
				content: [
					{
						type: MessageTypeEnum.TEXT,
						text: result.choices[0].message.content || "",
					},
				],
				role: MessageRoleEnum.ASSISTANT,
			},
		];
	};
}
