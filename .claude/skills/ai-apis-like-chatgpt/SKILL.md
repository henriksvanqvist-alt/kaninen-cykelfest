# ai-apis-like-chatgpt skill

Add AI API calls (OpenAI / compatible) to this Hono + Expo project.

## Environment variable
Backend uses `OPENAI_API_KEY` via `env` from `./env.js` (Zod-validated).

Add to `backend/src/env.ts`:
```typescript
import { z } from "zod";

const schema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  // ... other vars
});

export const env = schema.parse(process.env);
```

## Backend route pattern (backend/src/routes/ai.ts)
```typescript
import { Hono } from "hono";
import OpenAI from "openai";
import { env } from "../env.js";
import { stream } from "hono/streaming";

const aiRouter = new Hono();
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// Non-streaming
aiRouter.post("/chat", async (c) => {
  const { message } = await c.req.json();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: message }],
  });
  return c.json({ data: completion.choices[0].message.content });
});

// Streaming
aiRouter.post("/chat/stream", async (c) => {
  const { message } = await c.req.json();
  return stream(c, async (s) => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
      stream: true,
    });
    for await (const chunk of response) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      if (text) await s.write(text);
    }
  });
});

export { aiRouter };
```

Mount in `backend/src/index.ts`:
```typescript
app.route("/api/ai", aiRouter);
```

## Mobile usage
```typescript
// Non-streaming
const res = await api.post<string>("/api/ai/chat", { message: input });

// Streaming
const response = await fetch(`${BACKEND_URL}/api/ai/chat/stream`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: input }),
});
const reader = response.body!.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  setOutput(prev => prev + decoder.decode(value));
}
```

## Install
```bash
cd backend && bun add openai
git add package.json bun.lock && git commit -m "chore: add openai"
```
