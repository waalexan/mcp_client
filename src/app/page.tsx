'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

export default function Chat() {
  const { messages, sendMessage, addToolOutput, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  const [input, setInput] = useState('');

  return (
    <div className="flex flex-col h-screen w-full bg-gray-100">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((message) => (
          <div key={message.id} className="flex flex-col">
            <div
              className={`p-3 max-w-xl rounded-xl shadow-sm ${
                message.role === 'user'
                  ? 'self-end bg-blue-600 text-white'
                  : 'self-start bg-white text-gray-900'
              }`}
            >
              <div className="text-xs font-semibold mb-1 opacity-70">{message.role}</div>

              {message.parts.map((part: any, index) => {
                if (part.type === 'text') {
                  return <div key={index}>{part.text}</div>;
                }

                if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
                  const callId = part.toolCallId;
                  const { toolName, state, errorText, output, input: toolInput } = part;

                  return (
                    <div
                      key={index}
                      className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-300"
                    >
                      <div className="text-sm font-medium mb-1 text-purple-700">
                        Ferramenta: {part.type.startsWith('tool-') ? (part.type).slice(5) : toolName}
                      </div>

                      {toolInput && (
                        <div className="mb-2 text-gray-600 text-sm">
                          <div className="font-semibold">Input:</div>
                          <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(toolInput, null, 2)}</pre>
                        </div>
                      )}

                      {state === 'input-streaming' && (
                        <div className="text-gray-500 mt-1 italic">Aguardando entrada...</div>
                      )}

                      {state === 'input-available' && (
                        <div className="mt-2 flex flex-col gap-2">
                          <div className="text-sm">{toolInput?.message ?? 'Confirma?'}</div>
                          <div className="flex gap-3 mt-1">
                            <button
                              onClick={() =>
                                addToolOutput({
                                  tool: toolName,
                                  toolCallId: callId,
                                  output: 'Yes, confirmed.',
                                })
                              }
                              className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                            >
                              Sim
                            </button>
                            <button
                              onClick={() =>
                                addToolOutput({
                                  tool: toolName,
                                  toolCallId: callId,
                                  output: 'No, denied.',
                                })
                              }
                              className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                            >
                              Não
                            </button>
                          </div>
                        </div>
                      )}

                      {state === 'output-available' && (
                        <div className="mt-2 text-sm">
                          <div className="font-semibold text-green-700">Output:</div>
                          <pre className="bg-green-50 p-2 rounded">{JSON.stringify(output, null, 2)}</pre>
                        </div>
                      )}

                      {state === 'output-error' && (
                        <div className="mt-2 text-sm text-red-700">
                          <div className="font-semibold">Erro:</div> {errorText ?? 'Erro desconhecido'}
                        </div>
                      )}
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        ))}

        {status === 'streaming' && (
          <div className="text-gray-500 italic p-2">O modelo está digitando...</div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput('');
          }
        }}
        className="border-t bg-white p-3 flex items-center gap-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 px-4 py-2 rounded-xl outline-none text-black"
        />

        <button
          type="submit"
          disabled={status === 'streaming'}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
        >
          {status === 'streaming' ? 'x' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
