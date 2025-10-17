/**
 * AI请求数据传输对象
 */
export interface AIMessage {
    role: string;
    content: string;
}

export interface AIRequest {
    messageList: AIMessage[];
    billId: number;
}

/**
 * AI响应数据传输对象 - 流式数据单条
 */
export interface AIStreamResponse {
    content: string;
    id: number;
}
