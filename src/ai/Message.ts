export enum MessageRoleEnum {
	USER = "user",
	ASSISTANT = "assistant",
	SYSTEM = "system",
	TOOL = "tool",
}
export enum MessageTypeEnum {
	TEXT = "text",
	FILE = "file",
	IMAGE_URL = "image_url",
}
type TMessageContent =
	| { type: MessageTypeEnum.TEXT; text: string }
	| {
			type: MessageTypeEnum.FILE;
			file: {
				file_id: string;
			};
			fileContent?: {
				filename: string;
				size: string;
				ext: string;
			};
	  }
	| {
			type: MessageTypeEnum.IMAGE_URL;
			image_url: {
				url: string;
			};
	  };
export type TMessageInput = {
	role: MessageRoleEnum;
	content: TMessageContent[];
};
export type TMessage = {
	tool_call_id?: string;
	tool_calls?: {
		id: string;
		type: "function";
		function: { name: string; arguments: string };
	}[];
	content: TMessageContent[];
	role: MessageRoleEnum;
};

export type TMesasgeParsedDocument = TMessage & {
	_id: string;
};
export type TChatMessage = Pick<
	TMesasgeParsedDocument,
	"content" | "role" | "_id" | "tool_calls"
> & { file?: File | null };
