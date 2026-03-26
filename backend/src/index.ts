import { Hono } from "hono";
import { cors } from "hono/cors";
import "./env.js";
import { sampleRouter } from "./routes/sample.js";
import { cykelfestRouter } from "./routes/cykelfest.js";
import { logger } from "hono/logger";
import { prisma } from "./prisma.js";
import ExcelJS from "exceljs";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { join, extname } from "path";
import { randomUUID } from "crypto";

// Resolve path to files shipped with the backend
function backendFile(...parts: string[]): string {
  // Candidates: Vibecode path, process.cwd(), relative to src
  const candidates = [
    join("/home/user/workspace/backend", ...parts),
    join(process.cwd(), ...parts),
    join(process.cwd(), "backend", ...parts),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return join(process.cwd(), ...parts);
}

const app = new Hono();

// CORS middleware
const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^https:\/\/[a-z0-9-]+\.github\.io$/,
];

app.use(
  "*",
  cors({
    origin: (origin) => (origin && allowed.some((re) => re.test(origin)) ? origin : null),
    credentials: true,
    exposeHeaders: ["Content-Disposition"],
  })
);

app.use("*", logger());

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// DB test
app.get("/health/db", async (c) => {
  try {
    const count = await prisma.news.count();
    return c.json({ status: "ok", newsCount: count });
  } catch (err: any) {
    return c.json({ error: String(err), code: err?.code, meta: err?.meta }, 500);
  }
});

// Download updated cykelfest document
app.get("/api/cykelfest/download-algoritm", async (c) => {
  const [participants, assignments] = await Promise.all([
    prisma.participant.findMany({ select: { name: true, confirmed: true } }),
    prisma.hostAssignment.findMany({ select: { hostNames: true, pin: true, meal: true, type: true } }),
  ]);

  const confirmedSet = new Set(
    participants.filter((p) => p.confirmed).map((p) => p.name.trim().toLowerCase())
  );
  const pinByName = new Map<string, string>();
  const uppdragByName = new Map<string, string>();
  for (const a of assignments) {
    const names = a.hostNames.split(/[&;]/).map((n: string) => n.trim().toLowerCase());
    for (const n of names) {
      pinByName.set(n, a.pin);
      if (a.type === "task" && a.meal) uppdragByName.set(n, a.meal);
    }
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(backendFile("cykelfest_source.xlsx"));
  const ws = wb.getWorksheet("Algoritm 2026");
  if (!ws) return c.json({ error: "Source file missing sheet" }, 500);

  const now = new Date(new Date().toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" }));
  const pad = (n: number) => String(n).padStart(2, "0");

  const timestampText = `Genererad: ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} kl ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  ws.getRow(3).getCell(1).value = timestampText;

  const noFill: ExcelJS.Fill = { type: "pattern", pattern: "none" };
  for (let r = 1; r <= 5; r++) {
    const row = ws.getRow(r);
    for (let col = 2; col <= 33; col++) {
      const cell = row.getCell(col);
      const fill = cell.fill as any;
      if (fill?.fgColor?.argb === "FFFFF2CC" || fill?.bgColor?.argb === "FFFFF2CC") {
        cell.fill = noFill;
        cell.border = {};
      }
    }
  }

  const infoFont: Partial<ExcelJS.Font> = {
    bold: true,
    size: 12,
    color: { argb: "FF7A5C00" },
    name: "Arial",
  };
  const row4 = ws.getRow(4);
  for (const col of [10, 31, 32]) {
    const cell = row4.getCell(col);
    cell.value = "Skrivs vid export";
    cell.fill = noFill;
    cell.border = {};
    cell.font = infoFont;
    cell.alignment = { horizontal: "center" };
  }

  for (let rowNum = 9; rowNum <= ws.rowCount; rowNum++) {
    const row = ws.getRow(rowNum);
    const fn = String(row.getCell(3).value ?? "").trim();
    const ln = String(row.getCell(4).value ?? "").trim();
    if (!fn && !ln) continue;
    const fullName = `${fn} ${ln}`.trim().toLowerCase();
    row.getCell(10).value = confirmedSet.has(fullName) ? "Ja" : "Nej";
    const uppdrag = uppdragByName.get(fullName);
    if (uppdrag) row.getCell(31).value = uppdrag;
    const pin = pinByName.get(fullName);
    if (pin) row.getCell(32).value = pin;
  }

  ws.autoFilter = { from: { row: 7, column: 1 }, to: { row: 7, column: 33 } };
  const buf = await wb.xlsx.writeBuffer();
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;

  return new Response(new Uint8Array(buf as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="cykelfest_2026_${dateStr}.xlsx"`,
      "Cache-Control": "no-cache",
    },
  });
});

// Download participant template
app.get("/api/cykelfest/participant-template", (c) => {
  const buf = readFileSync(backendFile("participant-template.xlsx"));
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="deltagarimport-mall.xlsx"',
    },
  });
});

// Serve user manual
app.get("/manual", async (c) => {
  try {
    const html = readFileSync(backendFile("..", "mobile", "assets", "manual.html"), "utf-8");
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch {
    return c.json({ error: "Manual not found" }, 404);
  }
});

// Routes
app.route("/api/sample", sampleRouter);
app.route("/api/cykelfest", cykelfestRouter);

const UPLOADS_DIR = backendFile("uploads");
mkdirSync(UPLOADS_DIR, { recursive: true });

app.post("/api/upload", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }

  const id = randomUUID();
  const ext = extname(file.name) || "";
  const filename = `${id}${ext}`;
  const filepath = join(UPLOADS_DIR, filename);

  const buffer = await file.arrayBuffer();
  writeFileSync(filepath, new Uint8Array(buffer));

  const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
  const url = `${baseUrl}/uploads/${filename}`;

  return c.json({
    data: {
      id,
      url,
      filename: file.name,
      contentType: file.type,
      sizeBytes: file.size,
    },
  });
});

app.get("/uploads/:filename", async (c) => {
  const filename = c.req.param("filename");
  const filepath = join(UPLOADS_DIR, filename);
  if (!existsSync(filepath)) return c.json({ error: "Not found" }, 404);
  const buf = readFileSync(filepath);
  const ext = extname(filename).slice(1).toLowerCase();
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    gif: "image/gif", webp: "image/webp", mp4: "video/mp4",
    mov: "video/quicktime", pdf: "application/pdf",
  };
  const contentType = mimeMap[ext] || "application/octet-stream";
  return new Response(buf, { headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000" } });
});

export { app };

// Start server when running directly (Bun / Node)
if (typeof Bun !== "undefined") {
  const port = Number(process.env.PORT) || 3000;
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${port}`);
  (globalThis as any).Bun?.serve?.({ port, fetch: app.fetch });
}
