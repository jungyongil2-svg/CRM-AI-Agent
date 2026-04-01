import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import "dotenv/config";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { generateTmScriptGeminiServer } from "./src/server/geminiTm";
import { generateSmsGeminiServer } from "./src/server/geminiSms";
import { matchCustomersWithSmsRag } from "./src/server/excelRagMatch";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    {
      name: "gemini-api-middleware",
      configureServer(server) {
        server.middlewares.use(createHandler());
      },
      configurePreview(server) {
        server.middlewares.use(createHandler());
      },
    },
  ],
  resolve: {
    alias: { "@": resolve(__dirname, "./src") },
  },
});

function createHandler() {
  return async (req: any, res: any, next: any) => {
    if (req.method !== "POST") return next();
    const isTm = req.url?.startsWith("/api/gemini/tm-script");
    const isSms = req.url?.startsWith("/api/gemini/sms");
    const isRagMatch = req.url?.startsWith("/api/rag/match-customers");
    if (!isTm && !isSms && !isRagMatch) return next();

    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString("utf-8");
      const body = raw ? JSON.parse(raw) : {};

      if (isTm) {
        const result = await generateTmScriptGeminiServer({
          customer: body.customer,
          retrievedSnippets: body.retrievedSnippets ?? [],
        });
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify(result));
        return;
      }

      if (isRagMatch) {
        const customers = Array.isArray(body.customers) ? body.customers : [];
        const { customers: matched, rag } = matchCustomersWithSmsRag(customers);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ customers: matched, rag }));
        return;
      }

      const message = await generateSmsGeminiServer({
        customer: body.customer,
        retrievedSnippets: body.retrievedSnippets ?? [],
      });

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ message }));
    } catch (e: any) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: e?.message ?? "unknown error" }));
    }
  };
}
