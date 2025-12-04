import { experimental_createMCPClient } from '@ai-sdk/mcp';
import { google } from '@ai-sdk/google';
import { convertToModelMessages, streamText, tool, UIMessage } from 'ai';
import z from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const mcpClient = await experimental_createMCPClient({
        transport: {
            type: "http",
            url: process.env.MCP_HOST || "http://localhost:3001/mcp",
        },
    });

    const mcpTools = await mcpClient.tools();
    const resourceData = await mcpClient.readResource({
        uri: 'ui://widget/content-template.html',
    });

    console.log("resourceData", resourceData)

    const localTools = {
        getWeather: tool({
            description: 'Get the weather in a location',
            inputSchema: z.object({
                location: z.string().describe('The location to get the weather for'),
            }),
            execute: async ({ location }) => ({
                location,
                temperature: 72 + Math.floor(Math.random() * 21) - 10,
            }),
        }),
    };

    const result = streamText({
        model: google("gemini-2.0-flash-001"),
        tools: {
            ...mcpTools,
            ...localTools,
        },
        messages: convertToModelMessages(messages),
        onFinish: async () => {
            await mcpClient.close();
        },
    });

    return result.toUIMessageStreamResponse();
}
