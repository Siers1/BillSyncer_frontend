import type { AIRequest, AIStreamResponse } from '@/dto/AIRequest';
import { useAuthStore } from '@/stores/authStore';

/**
 * AI分析接口 - 支持流式数据传输
 * @param aiRequest AI请求数据
 * @param onMessage 接收流式数据的回调函数
 * @param onError 错误处理回调函数
 * @param onComplete 完成时的回调函数
 */
export const analyzeStream = async (
    aiRequest: AIRequest,
    onMessage: (data: AIStreamResponse) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
) => {
    const authStore = useAuthStore();
    
    try {
        const response = await fetch('/api/ai/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authStore.accessToken}`,
                // 流式传输相关头部
                'Accept': 'text/stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            },
            body: JSON.stringify(aiRequest)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('无法获取响应流');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                onComplete?.();
                break;
            }

            // 将新数据添加到缓冲区
            buffer += decoder.decode(value, { stream: true });
            
            // 按行分割数据
            const lines = buffer.split('\n');
            // 保留最后一行（可能不完整）
            buffer = lines.pop() || '';
            
            // 处理完整的行
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('data:')) {
                    try {
                        const jsonStr = trimmedLine.slice(5); // 移除 'data:' 前缀
                        const data = JSON.parse(jsonStr) as AIStreamResponse;
                        
                        // 检查是否是结束标志
                        if (data.content === '[DONE]') {
                            onComplete?.();
                            return;
                        }
                        
                        onMessage(data);
                    } catch (parseError) {
                        console.warn('解析流数据失败:', parseError, '原始数据:', trimmedLine);
                    }
                }
            }
        }
    } catch (error) {
        onError?.(error as Error);
    }
};
