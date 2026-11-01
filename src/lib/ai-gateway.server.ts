const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export class AiGatewayError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

type ChatMessage = { role: "system" | "user"; content: unknown };

/**
 * Streams a chat completion with a strict JSON schema and returns the parsed object.
 * Streaming avoids buffered timeouts on long audio.
 */
export async function streamChatJson<T>(opts: {
  model: string;
  messages: ChatMessage[];
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<T> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiGatewayError("AI is not configured.", 401);

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: opts.model,
      stream: true,
      messages: opts.messages,
      response_format: {
        type: "json_schema",
        json_schema: { name: opts.schemaName, strict: true, schema: opts.schema },
      },
    }),
  });

  if (!res.ok || !res.body) {
    let message = `AI request failed (${res.status}).`;
    try {
      const body = (await res.json()) as { message?: string; error?: { message?: string } };
      message = body.message ?? body.error?.message ?? message;
    } catch {
      /* keep default */
    }
    if (res.status === 402) message = "AI credits are used up for this workspace. Please try again later.";
    if (res.status === 429) message = "Too many requests right now. Please try again in a minute.";
    throw new AiGatewayError(message, res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const chunk = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
        text += chunk.choices?.[0]?.delta?.content ?? "";
      } catch {
        /* ignore keep-alives */
      }
    }
  }
  if (!text.trim()) throw new AiGatewayError("The AI returned an empty response.", 502);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AiGatewayError("The AI response could not be read.", 502);
  }
}
