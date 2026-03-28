import { Hono } from "hono";
import { prisma } from "../prisma.js";
import { Prisma } from "@prisma/client";
import { env } from "../env.js";
import { Resend } from "resend";
import * as XLSX from "xlsx";
import { z } from "zod";

// ---- VALIDATION SCHEMAS ----
const CreateNewsSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  type: z.enum(["info", "viktig", "nyhet", "omrostning"]).optional(),
  publishedBy: z.string().optional(),
  pollId: z.string().optional().nullable(),
});

const CreateScoreSchema = z.object({
  teamId: z.string().min(1),
  points: z.number(),
  reason: z.string().optional(),
  phaseId: z.string().optional().nullable(),
});

const CreatePollSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  closesAt: z.string().optional().nullable(),
  correctAnswer: z.number().optional().nullable(),
});

const UpdateHostAssignmentSchema = z.object({
  type: z.string().optional(),
  hostNames: z.string().optional(),
  address: z.string().optional().nullable(),
  meal: z.string().optional().nullable(),
  arrivalTime: z.string().optional().nullable(),
  hostNotes: z.string().optional().nullable(),
  guestInfo: z.string().optional().nullable(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);

const UpdateSettingSchema = z.object({
  value: z.string(),
});

// Normalize a name for comparison: trim whitespace, lowercase, collapse inner spaces
function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Determine the PIN prefix digit based on meal type or assignment type
function getMealPinPrefix(meal: string | null, type?: string | null): number | null {
  // task/uppdrag assignments always get prefix 4
  if (type === "task") return 4;
  if (!meal) return null;
  const lower = meal.toLowerCase();
  if (lower.includes("förrätt")) return 1;
  if (lower.includes("varmrätt") || lower.includes("middag")) return 2;
  if (lower.includes("efterrätt")) return 3;
  return null;
}

// Generate a sequential host assignment PIN based on meal type.
// Prefix digit: 1=förrätt, 2=varmrätt/middag, 3=efterrätt, 4=uppdrag/task
// Format: prefix + 3-digit sequence (e.g. 1001, 2003, 4002)
// For unknown types: falls back to random 4-digit number.
// Pass a Prisma transaction client (tx) when inside a transaction, otherwise uses prisma directly.
async function generateHostPin(
  meal: string | null,
  tx?: Prisma.TransactionClient,
  type?: string | null
): Promise<string> {
  const db = tx ?? prisma;
  const prefix = getMealPinPrefix(meal, type);

  if (prefix === null) {
    // Fall back to random generation for unknown meal types
    let pin: string;
    let attempts = 0;
    do {
      pin = Math.floor(1000 + Math.random() * 9000).toString();
      const existing = await db.hostAssignment.findUnique({ where: { pin } });
      if (!existing) return pin;
      attempts++;
    } while (attempts < 20);
    return pin!;
  }

  // Count existing assignments with the same prefix digit to derive sequence number
  const _mealPatterns: Record<number, string[]> = {
    1: ["Förrätt", "förrätt"],
    2: ["Varmrätt", "varmrätt", "Middag", "middag"],
    3: ["Efterrätt", "efterrätt"],
    4: ["task"],
  };

  // Find all existing pins that start with this prefix digit to determine current max sequence
  // We query by meal category to get an accurate count
  const prefixStr = prefix.toString();
  const existingWithSamePrefix = await db.hostAssignment.findMany({
    where: {
      pin: {
        startsWith: prefixStr,
      },
    },
    select: { pin: true },
  });

  // Filter to only valid sequential PINs (prefix + exactly 3 digits)
  const sequentialPins = existingWithSamePrefix
    .map((a) => parseInt(a.pin, 10))
    .filter((n) => !isNaN(n) && n >= prefix * 1000 && n <= prefix * 1000 + 999);

  let sequence = sequentialPins.length + 1;

  // Ensure uniqueness — increment sequence until we find a free PIN
  let pin: string;
  let attempts = 0;
  do {
    pin = `${prefix}${String(sequence).padStart(3, "0")}`;
    const existing = await db.hostAssignment.findUnique({ where: { pin } });
    if (!existing) return pin;
    sequence++;
    attempts++;
  } while (attempts < 100);

  return pin!;
}

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const NOTIFY_EMAIL = "kaninencykelfest@gmail.com";

export const cykelfestRouter = new Hono();

// ---- PARTICIPANTS ----
// Get participant by access code
cykelfestRouter.get("/participant/:code", async (c) => {
  const code = c.req.param("code");
  const participant = await prisma.participant.findUnique({
    where: { accessCode: code },
    include: { team: true },
  });
  if (!participant) return c.json({ error: { message: "Not found" } }, 404);
  return c.json({ data: participant });
});

// ---- PHASES ----
cykelfestRouter.get("/phases", async (c) => {
  const phases = await prisma.phase.findMany({ orderBy: { orderIndex: "asc" } });
  return c.json({ data: phases });
});

cykelfestRouter.post("/phases", async (c) => {
  const body = await c.req.json();
  const phase = await prisma.phase.create({ data: body });
  return c.json({ data: phase });
});

// POST /setup — idempotent seed of required initial data (phases + teams)
cykelfestRouter.post("/setup", async (c) => {
  const PHASE_DEFS = [
    { name: "forrat", label: "Förrätt", orderIndex: 0 },
    { name: "aktivitet_1", label: "Aktivitet 1", orderIndex: 1 },
    { name: "middag", label: "Middag", orderIndex: 2 },
    { name: "aktivitet_2", label: "Aktivitet 2", orderIndex: 3 },
    { name: "efterratt", label: "Efterrätt", orderIndex: 4 },
    { name: "slutfest", label: "Slutfest", orderIndex: 5 },
  ];
  const TEAM_DEFS = ["Charter", "Safari", "Fjällvandring", "Tågluff", "Camping", "Träningsresa", "Backpacking", "Kryssning", "Alpresa", "Club 33"];

  // Seed phases (skip if already exist by name)
  const existingPhases = await prisma.phase.findMany();
  const existingNames = new Set(existingPhases.map((p) => p.name));
  const phasesCreated = [];
  for (const p of PHASE_DEFS) {
    if (!existingNames.has(p.name)) {
      const created = await prisma.phase.create({ data: p });
      phasesCreated.push(created);
    }
  }

  // Seed teams (skip if name already exists)
  const existingTeams = await prisma.team.findMany();
  const existingTeamNames = new Set(existingTeams.map((t) => t.name));
  const teamsCreated = [];
  for (const name of TEAM_DEFS) {
    if (!existingTeamNames.has(name)) {
      const created = await prisma.team.create({ data: { name } });
      teamsCreated.push(created);
    }
  }

  // Create destination quiz containers for each course if missing
  const COURSES = ["förrätt", "varmrätt", "efterrätt"];
  const quizzesCreated = [];
  for (const course of COURSES) {
    const existing = await prisma.destinationQuiz.findUnique({ where: { course } });
    if (!existing) {
      const created = await prisma.destinationQuiz.create({ data: { course } });
      quizzesCreated.push(created);
    }
  }

  return c.json({ data: { phasesCreated: phasesCreated.length, teamsCreated: teamsCreated.length, quizzesCreated: quizzesCreated.length } });
});

cykelfestRouter.post("/phases/:id/unlock", async (c) => {
  const id = c.req.param("id");
  const phase = await prisma.phase.update({
    where: { id },
    data: { unlockedAt: new Date() },
  });
  return c.json({ data: phase });
});

cykelfestRouter.post("/phases/:id/lock", async (c) => {
  const id = c.req.param("id");
  const phase = await prisma.phase.update({
    where: { id },
    data: { unlockedAt: null },
  });
  return c.json({ data: phase });
});

cykelfestRouter.put("/phases/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const phase = await prisma.phase.update({
    where: { id },
    data: {
      label: body.label,
      ...(body.detail !== undefined ? { detail: body.detail } : {}),
    },
  });
  return c.json({ data: phase });
});

// ---- NEWS ----
cykelfestRouter.get("/news", async (c) => {
  const news = await prisma.news.findMany({ orderBy: { createdAt: "desc" } });
  return c.json({ data: news });
});

cykelfestRouter.post("/news", async (c) => {
  const body = await c.req.json();
  const parsed = CreateNewsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { message: "Ogiltig data", details: parsed.error.flatten() } }, 400);
  }
  const validBody = parsed.data;
  const news = await prisma.news.create({
    data: {
      title: validBody.title,
      body: validBody.body,
      type: validBody.type || "info",
      publishedBy: validBody.publishedBy,
      pollId: validBody.pollId ?? null,
    },
  });
  return c.json({ data: news });
});

cykelfestRouter.delete("/news/:id", async (c) => {
  const id = c.req.param("id");
  await prisma.news.delete({ where: { id } });
  return c.json({ data: { success: true } });
});

cykelfestRouter.put("/news/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const news = await prisma.news.update({
    where: { id },
    data: {
      title: body.title,
      body: body.body,
      type: body.type,
      ...(body.pollId !== undefined ? { pollId: body.pollId } : {}),
    },
  });
  return c.json({ data: news });
});

// ---- TEAMS ----
cykelfestRouter.get("/teams", async (c) => {
  const teams = await prisma.team.findMany({
    include: { participants: true, scores: true },
  });
  return c.json({ data: teams });
});

cykelfestRouter.post("/teams", async (c) => {
  const body = await c.req.json();
  const team = await prisma.team.create({ data: body });
  return c.json({ data: team });
});

cykelfestRouter.delete("/teams/:id", async (c) => {
  const id = c.req.param("id");
  await prisma.team.delete({ where: { id } });
  return c.json({ data: { ok: true } });
});

// ---- PARTICIPANTS ----
// Get all participants with team info
cykelfestRouter.get("/participants", async (c) => {
  // Fetch all participants with team info
  const participants = await prisma.participant.findMany({
    include: { team: true },
    orderBy: { name: "asc" },
  });
  return c.json({ data: participants });
});

// Create a new standalone participant (no team)
cykelfestRouter.post("/participants", async (c) => {
  const body = await c.req.json<{ name: string }>();
  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    return c.json({ error: { message: "Name is required" } }, 400);
  }
  const base = body.name.trim().toLowerCase().replace(/\s+/g, "-");
  const suffix = Math.random().toString(36).slice(2, 7);
  const accessCode = `${base}-${suffix}`;
  const participant = await prisma.participant.create({
    data: { name: body.name.trim(), accessCode, role: "guest" },
    include: { team: true },
  });
  return c.json({ data: participant }, 201);
});

// Add a participant to a team
cykelfestRouter.post("/teams/:id/participants", async (c) => {
  const teamId = c.req.param("id");
  const body = await c.req.json<{ name: string; phone?: string; role?: string }>();
  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    return c.json({ error: { message: "Name is required" } }, 400);
  }
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return c.json({ error: { message: "Team not found" } }, 404);

  // If participant already exists (by name), move them to this team instead of creating a duplicate
  const allByName = await prisma.participant.findMany({
    where: { name: body.name.trim() },
  });
  const existing = allByName[0] ?? null;
  if (existing) {
    const participant = await prisma.participant.update({
      where: { id: existing.id },
      data: { teamId },
    });
    return c.json({ data: participant }, 200);
  }

  // Generate a unique access code from the name + random suffix
  const base = body.name.trim().toLowerCase().replace(/\s+/g, "-");
  const suffix = Math.random().toString(36).slice(2, 7);
  const accessCode = `${base}-${suffix}`;

  const participant = await prisma.participant.create({
    data: {
      name: body.name.trim(),
      teamId,
      accessCode,
      role: body.role ?? "guest",
      phone: body.phone ?? null,
    },
  });
  return c.json({ data: participant }, 201);
});

// List participants for a team
cykelfestRouter.get("/teams/:id/participants", async (c) => {
  const teamId = c.req.param("id");
  const participants = await prisma.participant.findMany({
    where: { teamId },
    orderBy: { createdAt: "asc" },
  });
  return c.json({ data: participants });
});

// Delete a participant from a team
cykelfestRouter.delete("/teams/:teamId/participants/:participantId", async (c) => {
  const participantId = c.req.param("participantId");
  const teamId = c.req.param("teamId");
  const participant = await prisma.participant.findUnique({ where: { id: participantId } });
  if (!participant || participant.teamId !== teamId) {
    return c.json({ error: { message: "Participant not found in this team" } }, 404);
  }
  await prisma.participant.delete({ where: { id: participantId } });
  return c.json({ data: { ok: true } });
});

// ---- VIDEOS ----
cykelfestRouter.get("/videos", async (c) => {
  const videos = await prisma.video.findMany({ orderBy: { publishedAt: "desc" } });
  return c.json({ data: videos });
});

cykelfestRouter.post("/videos", async (c) => {
  const body = await c.req.json();
  const video = await prisma.video.create({ data: body });
  return c.json({ data: video });
});

cykelfestRouter.post("/videos/:id/mark-seen", async (c) => {
  const id = c.req.param("id");
  const video = await prisma.video.update({ where: { id }, data: { isNew: false } });
  return c.json({ data: video });
});

// ---- POLLS ----
cykelfestRouter.get("/polls", async (c) => {
  const polls = await prisma.poll.findMany({
    include: { votes: true },
    orderBy: { orderIndex: "asc" },
  });
  return c.json({ data: polls });
});

cykelfestRouter.post("/polls", async (c) => {
  const body = await c.req.json();
  const parsed = CreatePollSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { message: "Ogiltig data", details: parsed.error.flatten() } }, 400);
  }
  const validBody = parsed.data;
  const poll = await prisma.poll.create({
    data: {
      question: validBody.question,
      options: JSON.stringify(validBody.options),
      closesAt: validBody.closesAt ? new Date(validBody.closesAt) : null,
      correctAnswer: validBody.correctAnswer ?? null,
    },
  });
  return c.json({ data: poll });
});

cykelfestRouter.put("/polls/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const poll = await prisma.poll.update({
    where: { id },
    data: {
      question: body.question,
      options: JSON.stringify(body.options),
      orderIndex: body.orderIndex,
      correctAnswer: body.correctAnswer ?? null,
    },
  });
  return c.json({ data: poll });
});

cykelfestRouter.delete("/polls/:id", async (c) => {
  const id = c.req.param("id");
  await prisma.poll.delete({ where: { id } });
  // Clear any News items that reference this poll
  await prisma.$executeRaw`UPDATE News SET pollId = NULL WHERE pollId = ${id}`;
  return c.json({ data: { ok: true } });
});

cykelfestRouter.post("/polls/:id/vote", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const deviceId = body.participantId ?? body.voterId;
  if (!deviceId) return c.json({ error: { message: "participantId required" } }, 400);
  // Find or create an anonymous participant keyed by device UUID (accessCode)
  let participant = await prisma.participant.findUnique({ where: { accessCode: deviceId } });
  if (!participant) {
    participant = await prisma.participant.create({
      data: { name: "Anonym", accessCode: deviceId, role: "guest" },
    });
  }
  const vote = await prisma.pollVote.upsert({
    where: { pollId_participantId: { pollId: id, participantId: participant.id } },
    update: { optionIndex: body.optionIndex },
    create: { pollId: id, participantId: participant.id, optionIndex: body.optionIndex },
  });
  return c.json({ data: vote });
});

// ---- SCORES ----
cykelfestRouter.get("/scores", async (c) => {
  const scores = await prisma.score.findMany({
    include: { team: true, phase: true },
    orderBy: { awardedAt: "desc" },
  });
  return c.json({ data: scores });
});

cykelfestRouter.post("/scores", async (c) => {
  const body = await c.req.json();
  const parsed = CreateScoreSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { message: "Ogiltig data", details: parsed.error.flatten() } }, 400);
  }
  const validBody = parsed.data;
  const score = await prisma.score.upsert({
    where: { teamId_reason: { teamId: validBody.teamId, reason: validBody.reason ?? "" } },
    update: {
      phaseId: validBody.phaseId || null,
      points: validBody.points,
      awardedAt: new Date(),
    },
    create: {
      teamId: validBody.teamId,
      phaseId: validBody.phaseId || null,
      points: validBody.points,
      reason: validBody.reason ?? "",
    },
  });
  return c.json({ data: score });
});

cykelfestRouter.delete("/scores", async (c) => {
  const confirm = c.req.query("confirm");
  if (confirm !== "true") {
    return c.json({ error: { message: "Missing required query parameter: confirm=true" } }, 400);
  }
  await prisma.score.deleteMany({});
  return c.json({ data: { ok: true } });
});

// ---- TEAM ARRIVALS ----
cykelfestRouter.get("/arrivals", async (c) => {
  const arrivals = await prisma.teamArrival.findMany({
    include: { team: true, phase: true },
  });
  return c.json({ data: arrivals });
});

cykelfestRouter.post("/arrivals/arrive", async (c) => {
  const body = await c.req.json();
  if (!body.teamId || !body.phaseId) {
    return c.json({ error: { message: "teamId och phaseId krävs" } }, 400);
  }
  const arrival = await prisma.teamArrival.upsert({
    where: { teamId_phaseId: { teamId: body.teamId, phaseId: body.phaseId } },
    update: { arrivedAt: new Date(), hostNote: body.hostNote },
    create: { teamId: body.teamId, phaseId: body.phaseId, arrivedAt: new Date(), hostNote: body.hostNote },
  });
  return c.json({ data: arrival });
});

cykelfestRouter.post("/arrivals/depart", async (c) => {
  const body = await c.req.json();
  if (!body.teamId || !body.phaseId) {
    return c.json({ error: { message: "teamId och phaseId krävs" } }, 400);
  }
  const arrival = await prisma.teamArrival.upsert({
    where: { teamId_phaseId: { teamId: body.teamId, phaseId: body.phaseId } },
    update: { departedAt: new Date() },
    create: { teamId: body.teamId, phaseId: body.phaseId, departedAt: new Date() },
  });
  return c.json({ data: arrival });
});

// ---- SETTINGS ----
cykelfestRouter.get("/settings", async (c) => {
  const settings = await prisma.appSetting.findMany();
  const map: Record<string, string> = {};
  settings.forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
  return c.json({ data: map });
});

cykelfestRouter.post("/settings/:key", async (c) => {
  const key = c.req.param("key");
  const body = await c.req.json();
  const parsed = UpdateSettingSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { message: "Ogiltig data", details: parsed.error.flatten() } }, 400);
  }
  const setting = await prisma.appSetting.upsert({
    where: { key },
    update: { value: parsed.data.value },
    create: { key, value: parsed.data.value },
  });
  return c.json({ data: setting });
});

// ---- QUESTIONS / FRÅGA KANINEN ----
cykelfestRouter.get("/questions", async (c) => {
  const questions = await prisma.question.findMany({
    orderBy: { createdAt: "desc" },
  });
  return c.json({ data: questions });
});

cykelfestRouter.post("/questions", async (c) => {
  const body = await c.req.json();
  const { text } = body;
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return c.json({ error: { message: "Text is required" } }, 400);
  }
  const question = await prisma.question.create({
    data: { text: text.trim() },
  });

  // Skicka mejlnotifiering om Resend är konfigurerat
  if (resend) {
    resend.emails.send({
      from: "Kaninens Cykelfest <onboarding@resend.dev>",
      to: NOTIFY_EMAIL,
      subject: "Ny fråga till kaninen",
      html: `<p>En ny fråga har kommit in:</p><blockquote>${text.trim()}</blockquote><p>Logga in i admin-panelen för att svara.</p>`,
    }).catch(() => {}); // fire-and-forget, ignorera fel
  }

  return c.json({ data: question });
});

cykelfestRouter.post("/questions/:id/answer", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { answer, answeredBy } = body;
  if (!answer || typeof answer !== "string" || answer.trim().length === 0) {
    return c.json({ error: { message: "Answer is required" } }, 400);
  }
  const question = await prisma.question.update({
    where: { id },
    data: { answer: answer.trim(), answeredBy, answeredAt: new Date() },
  });
  return c.json({ data: question });
});

cykelfestRouter.delete("/questions/:id", async (c) => {
  const id = c.req.param("id");
  await prisma.question.delete({ where: { id } });
  return c.json({ data: { ok: true } });
});

// ---- CLUES / LEDTRÅDAR ----

// GET all clues
cykelfestRouter.get("/clues", async (c) => {
  const clues = await prisma.clue.findMany({ orderBy: [{ course: "asc" }, { orderIndex: "asc" }] });
  return c.json({ data: clues });
});

// POST create clue
cykelfestRouter.post("/clues", async (c) => {
  const body = await c.req.json();
  const { course, title, body: clueBody, orderIndex } = body;
  if (!course || !title || !clueBody) return c.json({ error: { message: "Missing fields" } }, 400);
  const clue = await prisma.clue.create({ data: { course, title, body: clueBody, orderIndex: orderIndex ?? 0 } });
  return c.json({ data: clue });
});

// POST unlock entire course — must be before /:id routes
cykelfestRouter.post("/clues/unlock-course", async (c) => {
  const body = await c.req.json();
  const { course } = body;
  if (!course) return c.json({ error: { message: "Missing course" } }, 400);
  await prisma.clue.updateMany({ where: { course }, data: { locked: false } });
  return c.json({ data: { ok: true } });
});

// POST lock entire course — must be before /:id routes
cykelfestRouter.post("/clues/lock-course", async (c) => {
  const body = await c.req.json();
  const { course } = body;
  if (!course) return c.json({ error: { message: "Missing course" } }, 400);
  await prisma.clue.updateMany({ where: { course }, data: { locked: true } });
  return c.json({ data: { ok: true } });
});

// PUT update clue
cykelfestRouter.put("/clues/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const clue = await prisma.clue.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.body !== undefined ? { body: body.body } : {}),
      ...(body.locked !== undefined ? { locked: body.locked } : {}),
      ...(body.orderIndex !== undefined ? { orderIndex: body.orderIndex } : {}),
    },
  });
  return c.json({ data: clue });
});

// DELETE clue
cykelfestRouter.delete("/clues/:id", async (c) => {
  const id = c.req.param("id");
  await prisma.clue.delete({ where: { id } });
  return c.json({ data: { ok: true } });
});

// ---- DESTINATION QUIZ ----

// GET all destination quizzes (with questions)
cykelfestRouter.get("/destination-quizzes", async (c) => {
  const quizzes = await prisma.destinationQuiz.findMany({
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });
  return c.json({ data: quizzes });
});

// PUT update question — must be before /:course to avoid routing conflict
cykelfestRouter.put("/destination-quizzes/questions/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const q = await prisma.destinationQuestion.update({
    where: { id },
    data: {
      ...(body.question !== undefined ? { question: body.question } : {}),
      ...(body.options !== undefined ? { options: JSON.stringify(body.options) } : {}),
      ...(body.correctAnswer !== undefined ? { correctAnswer: body.correctAnswer } : {}),
      ...(body.orderIndex !== undefined ? { orderIndex: body.orderIndex } : {}),
      ...(body.contentType !== undefined ? { contentType: body.contentType } : {}),
      ...(body.contentText !== undefined ? { contentText: body.contentText } : {}),
      ...(body.contentUrl !== undefined ? { contentUrl: body.contentUrl } : {}),
    },
  });
  return c.json({ data: q });
});

// DELETE question — must be before /:course to avoid routing conflict
cykelfestRouter.delete("/destination-quizzes/questions/:id", async (c) => {
  const id = c.req.param("id");
  await prisma.destinationQuestion.delete({ where: { id } });
  return c.json({ data: { ok: true } });
});

// GET single quiz by course
cykelfestRouter.get("/destination-quizzes/:course", async (c) => {
  const course = decodeURIComponent(c.req.param("course"));
  const quiz = await prisma.destinationQuiz.findUnique({
    where: { course },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });
  if (!quiz) return c.json({ data: null });
  return c.json({ data: quiz });
});

// POST create or update quiz for a course (upsert)
cykelfestRouter.post("/destination-quizzes", async (c) => {
  const body = await c.req.json();
  const { course, imageUrl } = body;
  if (!course) return c.json({ error: { message: "Missing course" } }, 400);
  const quiz = await prisma.destinationQuiz.upsert({
    where: { course },
    create: { course, imageUrl: imageUrl ?? null },
    update: { imageUrl: imageUrl ?? undefined },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });
  return c.json({ data: quiz });
});

// POST add question to quiz
cykelfestRouter.post("/destination-quizzes/:course/questions", async (c) => {
  const course = decodeURIComponent(c.req.param("course"));
  const body = await c.req.json();
  const { question, options, correctAnswer, orderIndex, contentType, contentText, contentUrl } = body;
  if (!question || !options || correctAnswer === undefined) {
    return c.json({ error: { message: "Missing fields" } }, 400);
  }
  let quiz = await prisma.destinationQuiz.findUnique({ where: { course } });
  if (!quiz) {
    quiz = await prisma.destinationQuiz.create({ data: { course } });
  }
  const q = await prisma.destinationQuestion.create({
    data: {
      quizId: quiz.id,
      question,
      options: JSON.stringify(options),
      correctAnswer,
      orderIndex: orderIndex ?? 0,
      contentType: contentType ?? "text",
      contentText: contentText ?? null,
      contentUrl: contentUrl ?? null,
    },
  });
  return c.json({ data: q });
});

// ---- PROGRAM STOPS ----

// GET /program-stops — returns all stops (seeded with aktivitet_1 and aktivitet_2 defaults)
cykelfestRouter.get('/program-stops', async (c) => {
  const defaults = [
    {
      id: 'aktivitet_1',
      description: 'En jordglob betyder så mycket',
      rules: 'Lagen tävlar mot varandra. Alla i laget måste delta. Inga hjälpmedel tillåtna.',
      scoring: 'Vinnarlaget får 10 poäng, tvåan 9 poäng, trean 8 poäng och så vidare.',
    },
    {
      id: 'aktivitet_2',
      description: 'Jorden runt på sextio minuter',
      rules: 'Lagen tävlar mot varandra. Alla i laget måste delta. Inga hjälpmedel tillåtna.',
      scoring: 'Vinnarlaget får 10 poäng, tvåan 9 poäng, trean 8 poäng och så vidare.',
    },
    {
      id: 'avslutningsfesten',
      description: 'Den stora grisfesten',
      rules: 'Lagen tävlar mot varandra. Alla i laget måste delta. Inga hjälpmedel tillåtna.',
      scoring: 'Vinnarlaget får 10 poäng, tvåan 9 poäng, trean 8 poäng och så vidare.',
    },
  ];
  // Ensure rows exist
  for (const d of defaults) {
    await prisma.programStop.upsert({
      where: { id: d.id },
      update: {},
      create: d,
    });
  }
  const stops = await prisma.programStop.findMany();
  return c.json({ data: stops });
});

// PUT /program-stops/:id
cykelfestRouter.put('/program-stops/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const stop = await prisma.programStop.upsert({
    where: { id },
    update: {
      description: body.description ?? undefined,
      rules: body.rules ?? undefined,
      scoring: body.scoring ?? undefined,
    },
    create: {
      id,
      description: body.description,
      rules: body.rules,
      scoring: body.scoring,
    },
  });
  return c.json({ data: stop });
});

// ---- CONFIRMATION STATUS ----

// GET /stats — real-time statistics for admin
cykelfestRouter.get("/stats", async (c) => {
  const [participants, teams, hostAssignments, questions, polls] = await Promise.all([
    prisma.participant.findMany({ select: { id: true, confirmed: true, dietary: true, role: true, phone: true } }),
    prisma.team.findMany({ include: { participants: true } }),
    prisma.hostAssignment.findMany({ include: { guests: true } }),
    prisma.question.findMany({ select: { id: true, answer: true } }),
    prisma.poll.findMany({ include: { votes: true } }),
  ]);

  const totalParticipants = participants.length;
  const confirmedParticipants = participants.filter(p => p.confirmed).length;
  const withDietary = participants.filter(p => p.dietary && p.dietary.trim() !== '').length;
  const withPhone = participants.filter(p => p.phone && p.phone.trim() !== '').length;
  const hosts = participants.filter(p => p.role === 'host').length;
  const guests = participants.filter(p => p.role === 'guest').length;

  const totalTeams = teams.length;
  const teamsWithMembers = teams.filter(t => t.participants.length > 0).length;

  const totalHostAssignments = hostAssignments.length;
  const assignmentsWithAddress = hostAssignments.filter(h => h.address && h.address.trim() !== '').length;
  const assignmentsWithGuestInfo = hostAssignments.filter(h => h.guestInfo && h.guestInfo.trim() !== '').length;
  const totalGuests = hostAssignments.reduce((sum, h) => sum + h.guests.length, 0);

  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter(q => q.answer && q.answer.trim() !== '').length;

  const totalPollVotes = polls.reduce((sum, p) => sum + p.votes.length, 0);

  return c.json({
    data: {
      deltagare: {
        totalt: totalParticipants,
        bekraftade: confirmedParticipants,
        obekraftade: totalParticipants - confirmedParticipants,
        medAllergier: withDietary,
        medTelefon: withPhone,
        vardar: hosts,
        gaster: guests,
      },
      lag: {
        totalt: totalTeams,
        medDeltagare: teamsWithMembers,
      },
      vardskap: {
        totalt: totalHostAssignments,
        medAdress: assignmentsWithAddress,
        medGastinfo: assignmentsWithGuestInfo,
        totalGaster: totalGuests,
      },
      fragor: {
        totalt: totalQuestions,
        besvarade: answeredQuestions,
        obesvarade: totalQuestions - answeredQuestions,
      },
      omrostningar: {
        totalt: polls.length,
        totalRoster: totalPollVotes,
      },
    },
  });
});

// GET /participants/confirmation-status — returns all participants' name + confirmed status + phone + dietary + address + host pin
cykelfestRouter.get("/participants/confirmation-status", async (c) => {
  const [participants, hostAssignments] = await Promise.all([
    prisma.participant.findMany({
      select: { id: true, name: true, confirmed: true, phone: true, dietary: true, address: true },
      orderBy: { name: "asc" },
    }),
    prisma.hostAssignment.findMany({
      select: { id: true, pin: true, hostNames: true },
    }),
  ]);

  // Build a normalized name -> pin lookup from all HostAssignments
  const nameToPinMap = new Map<string, string>();
  for (const ha of hostAssignments) {
    if (!ha.pin || !ha.hostNames) continue;
    const names = ha.hostNames.split(/\s*&\s*/);
    for (const name of names) {
      nameToPinMap.set(normalizeName(name), ha.pin);
    }
  }

  return c.json({ data: participants.map((p) => ({
    id: p.id,
    name: p.name,
    confirmed: p.confirmed,
    phone: p.phone ?? null,
    dietary: p.dietary ?? null,
    address: p.address ?? null,
    pin: nameToPinMap.get(normalizeName(p.name)) ?? null,
  })) });
});

// PATCH /participants/:id/confirm — set confirmed = true and optionally update phone/address/dietary
cykelfestRouter.patch("/participants/:id/confirm", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ phone?: string; address?: string; dietary?: string }>().catch(() => ({ phone: undefined, address: undefined, dietary: undefined }));
  const updateData: { confirmed: boolean; phone?: string | null; address?: string | null; dietary?: string | null } = { confirmed: true };
  // Only update fields that were explicitly included in the request body
  if ("phone" in body) updateData.phone = body.phone?.trim() || null;
  if ("address" in body) updateData.address = body.address?.trim() || null;
  if ("dietary" in body) updateData.dietary = body.dietary?.trim() || null;
  const participant = await prisma.participant.update({
    where: { id },
    data: updateData,
  });
  return c.json({ data: { id: participant.id, confirmed: participant.confirmed } });
});

// PATCH /participants/:id — update participant fields
cykelfestRouter.patch("/participants/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ phone?: string | null; address?: string | null; dietary?: string | null; mission?: string | null; forratHost?: string | null; varmrattHost?: string | null; efterrattHost?: string | null }>();
  const participant = await prisma.participant.update({
    where: { id },
    data: {
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.address !== undefined ? { address: body.address } : {}),
      ...(body.dietary !== undefined ? { dietary: body.dietary } : {}),
      ...(body.mission !== undefined ? { mission: body.mission } : {}),
      ...(body.forratHost !== undefined ? { forratHost: body.forratHost } : {}),
      ...(body.varmrattHost !== undefined ? { varmrattHost: body.varmrattHost } : {}),
      ...(body.efterrattHost !== undefined ? { efterrattHost: body.efterrattHost } : {}),
    },
    include: { team: true },
  });
  return c.json({ data: participant });
});

// ---- HOST ASSIGNMENTS / VÄRDSKAP ----
cykelfestRouter.get("/host-assignments", async (c) => {
  const [assignments, allParticipants] = await Promise.all([
    prisma.hostAssignment.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.participant.findMany(),
  ]);

  const result = assignments.map((a) => {
    let guestParticipants: typeof allParticipants = [];
    if (a.meal === "Förrätt") {
      guestParticipants = allParticipants.filter(
        (p) => p.forratHost === a.hostNames
      );
    } else if (a.meal === "Varmrätt") {
      guestParticipants = allParticipants.filter(
        (p) => p.varmrattHost === a.hostNames
      );
    } else if (a.meal === "Efterrätt") {
      guestParticipants = allParticipants.filter(
        (p) => p.efterrattHost === a.hostNames
      );
    }
    // Filtrera bort värdarna själva från gästlistan
    const hostNamesList = a.hostNames.split(/\s*&\s*/).map((n) => normalizeName(n));
    const guests = guestParticipants
      .filter((p) => !hostNamesList.includes(normalizeName(p.name)))
      .map((p) => ({ participantName: p.name, dietary: p.dietary }));
    return { ...a, guests };
  });

  return c.json({ data: result });
});

// Get host assignments for a guest by name (optional ?meal=Förrätt filter)
cykelfestRouter.get("/host-assignments/by-guest/:name", async (c) => {
  const name = c.req.param("name");
  const mealFilter = c.req.query("meal");

  // Look up participant by name
  const allParticipants = await prisma.participant.findMany();
  const participant = allParticipants.find(p => normalizeName(p.name) === normalizeName(name)) ?? null;
  const participantInfo = participant ? { phone: participant.phone, dietary: participant.dietary } : null;

  if (!participant) {
    return c.json({ data: { assignments: [], participantInfo: null } });
  }

  // Build list of (hostNames, meal) pairs this person visits
  // For hosts: their own assignment (they eat at home for the meal they host)
  // For guests: look up HostAssignment by forratHost/varmrattHost/efterrattHost fields
  const hostNameMealPairs: { hostNames: string; meal: string }[] = [];
  if (participant.forratHost) hostNameMealPairs.push({ hostNames: participant.forratHost, meal: "Förrätt" });
  if (participant.varmrattHost) hostNameMealPairs.push({ hostNames: participant.varmrattHost, meal: "Varmrätt" });
  if (participant.efterrattHost) hostNameMealPairs.push({ hostNames: participant.efterrattHost, meal: "Efterrätt" });

  // Filter by meal if requested
  const filtered = mealFilter
    ? hostNameMealPairs.filter(p => p.meal === mealFilter)
    : hostNameMealPairs;

  // Fetch matching HostAssignments and build guest list from Participant table
  const matches = await Promise.all(
    filtered.map(async ({ hostNames, meal }) => {
      const ha = await prisma.hostAssignment.findFirst({
        where: { hostNames, meal },
      });
      if (!ha) return null;

      // Build guest list from Participant table based on meal field
      let guests: { participantName: string; dietary: string | null }[] = [];
      const mealField =
        meal === "Förrätt" ? "forratHost" :
        meal === "Varmrätt" ? "varmrattHost" :
        meal === "Efterrätt" ? "efterrattHost" : null;
      if (mealField) {
        const participants = await (prisma.participant as any).findMany({
          where: { [mealField]: hostNames },
          select: { name: true, dietary: true },
          orderBy: { name: "asc" },
        }) as { name: string; dietary: string | null }[];
        // Filtrera bort värdarna själva från gästlistan
        const hostNamesList = hostNames.split(/\s*&\s*/).map((n: string) => normalizeName(n));
        guests = participants
          .filter((p) => !hostNamesList.includes(normalizeName(p.name)))
          .map((p) => ({ participantName: p.name, dietary: p.dietary }));
      }

      return { ...ha, guests };
    })
  );

  return c.json({ data: { assignments: matches.filter(Boolean), participantInfo } });
});

// Get flat list of all guest names (for lookup browse, optional ?meal=Förrätt filter)
cykelfestRouter.get("/host-assignments/guests-list", async (c) => {
  const mealFilter = c.req.query("meal");

  // All participants have their host info in forratHost/varmrattHost/efterrattHost
  // Return all participant names (optionally filtered to those attending a specific meal)
  const participants = await prisma.participant.findMany({
    select: { name: true, forratHost: true, varmrattHost: true, efterrattHost: true },
  });

  let names: string[];
  if (mealFilter === "Förrätt") {
    names = participants.filter(p => p.forratHost).map(p => p.name);
  } else if (mealFilter === "Varmrätt") {
    names = participants.filter(p => p.varmrattHost).map(p => p.name);
  } else if (mealFilter === "Efterrätt") {
    names = participants.filter(p => p.efterrattHost).map(p => p.name);
  } else {
    names = participants.map(p => p.name);
  }

  names.sort((a, b) => a.localeCompare(b, 'sv'));
  return c.json({ data: names });
});

// Get single assignment by PIN (for host login)
cykelfestRouter.get("/host-assignments/by-pin/:pin", async (c) => {
  const pin = c.req.param("pin");
  const assignment = await prisma.hostAssignment.findUnique({
    where: { pin },
  });
  if (!assignment) return c.json({ error: { message: "Fel PIN-kod" } }, 404);

  // Build guest list from Participant table based on meal field
  let guests: { participantName: string; dietary: string | null }[] = [];
  if (assignment.hostNames && assignment.meal) {
    const mealField =
      assignment.meal === "Förrätt" ? "forratHost" :
      assignment.meal === "Varmrätt" ? "varmrattHost" :
      assignment.meal === "Efterrätt" ? "efterrattHost" : null;
    if (mealField) {
      const participants = await (prisma.participant as any).findMany({
        where: { [mealField]: assignment.hostNames },
        select: { name: true, dietary: true },
        orderBy: { name: "asc" },
      }) as { name: string; dietary: string | null }[];
      // Filtrera bort värdarna själva från gästlistan
      const hostNamesList = assignment.hostNames.split(/\s*&\s*/).map((n: string) => normalizeName(n));
      guests = participants
        .filter((p) => !hostNamesList.includes(normalizeName(p.name)))
        .map((p) => ({ participantName: p.name, dietary: p.dietary }));
    }
  }

  return c.json({ data: { ...assignment, guests } });
});

// Create new host assignment
cykelfestRouter.post("/host-assignments", async (c) => {
  const body = await c.req.json();
  // Auto-generate a unique PIN based on meal type, or use provided PIN
  let pin = body.pin;
  if (!pin) {
    pin = await generateHostPin(body.meal ?? null, undefined, body.type ?? null);
  }
  const assignment = await prisma.hostAssignment.create({
    data: {
      type: body.type ?? "meal",
      pin,
      hostNames: body.hostNames,
      address: body.address ?? null,
      meal: body.meal ?? null,
      arrivalTime: body.arrivalTime ?? null,
      hostNotes: body.hostNotes ?? null,
      guestInfo: body.guestInfo ?? null,
    },
  });
  return c.json({ data: { ...assignment, guests: [] } }, 201);
});

// Update host assignment
cykelfestRouter.put("/host-assignments/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = UpdateHostAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { message: "Ogiltig data", details: parsed.error.flatten() } }, 400);
  }

  // Fetch old assignment before update to detect hostNames change
  const oldAssignment = await prisma.hostAssignment.findUnique({ where: { id } });
  const oldHostNames = oldAssignment?.hostNames ?? null;
  const newHostNames: string = body.hostNames;
  const meal: string | null = body.meal ?? null;

  const assignment = await prisma.hostAssignment.update({
    where: { id },
    data: {
      type: body.type,
      // pin is intentionally excluded — it is generated once at creation and never changes
      hostNames: newHostNames,
      address: body.address ?? null,
      meal,
      arrivalTime: body.arrivalTime ?? null,
      hostNotes: body.hostNotes ?? null,
      guestInfo: body.guestInfo ?? null,
    },
  });

  // If hostNames changed, update Participant records that referenced the old name
  if (oldHostNames && newHostNames && oldHostNames !== newHostNames && meal) {
    const mealField =
      meal === "Förrätt" ? "forratHost" :
      meal === "Varmrätt" ? "varmrattHost" :
      meal === "Efterrätt" ? "efterrattHost" : null;
    if (mealField) {
      await (prisma.participant as any).updateMany({
        where: { [mealField]: { equals: oldHostNames, mode: "insensitive" } },
        data: { [mealField]: newHostNames },
      });
    }
  }

  // Build guest list from Participant table based on updated meal field
  let guests: { participantName: string; dietary: string | null }[] = [];
  const updatedMeal = assignment.meal;
  const updatedHostNames = assignment.hostNames;
  if (updatedHostNames && updatedMeal) {
    const mealField =
      updatedMeal === "Förrätt" ? "forratHost" :
      updatedMeal === "Varmrätt" ? "varmrattHost" :
      updatedMeal === "Efterrätt" ? "efterrattHost" : null;
    if (mealField) {
      const participants = await (prisma.participant as any).findMany({
        where: { [mealField]: updatedHostNames },
        select: { name: true, dietary: true },
        orderBy: { name: "asc" },
      }) as { name: string; dietary: string | null }[];
      // Filtrera bort värdarna själva från gästlistan
      const hostNamesList = updatedHostNames.split(/\s*&\s*/).map((n: string) => normalizeName(n));
      guests = participants
        .filter((p) => !hostNamesList.includes(normalizeName(p.name)))
        .map((p) => ({ participantName: p.name, dietary: p.dietary }));
    }
  }

  return c.json({ data: { ...assignment, guests } });
});

// Delete host assignment
cykelfestRouter.delete("/host-assignments/:id", async (c) => {
  const id = c.req.param("id");

  // Before deleting, clear Participant meal-host fields that reference this assignment
  const assignment = await prisma.hostAssignment.findUnique({ where: { id } });
  if (assignment && assignment.hostNames && assignment.meal) {
    const mealField =
      assignment.meal === "Förrätt" ? "forratHost" :
      assignment.meal === "Varmrätt" ? "varmrattHost" :
      assignment.meal === "Efterrätt" ? "efterrattHost" : null;
    if (mealField) {
      await (prisma.participant as any).updateMany({
        where: { [mealField]: { equals: assignment.hostNames, mode: "insensitive" } },
        data: { [mealField]: null },
      });
    }
  }

  await prisma.hostAssignment.delete({ where: { id } });
  return c.json({ data: { ok: true } });
});

// Send PIN via SMS to host — requires ELKS_API_USERNAME + ELKS_API_PASSWORD env vars
cykelfestRouter.post("/host-assignments/:id/send-pin-sms", async (c) => {
  const id = c.req.param("id");
  const assignment = await prisma.hostAssignment.findUnique({ where: { id } });
  if (!assignment) return c.json({ error: { message: "Värdskap hittades inte" } }, 404);

  // Find phone numbers for hosts by matching names against participants
  const hostNames = assignment.hostNames.split("&").map((n: string) => n.trim()).filter(Boolean);
  const participants = await prisma.participant.findMany({
    where: { name: { in: hostNames } },
    select: { name: true, phone: true },
  });

  const withPhone = participants.filter((p: { name: string; phone: string | null }) => p.phone);
  if (withPhone.length === 0) {
    return c.json({ error: { message: "Inga telefonnummer hittades för värdparet" } }, 400);
  }

  const username = process.env.ELKS_API_USERNAME;
  const password = process.env.ELKS_API_PASSWORD;
  if (!username || !password) {
    return c.json({ error: { message: "SMS-tjänst ej konfigurerad (saknar ELKS_API_USERNAME/ELKS_API_PASSWORD)" } }, 503);
  }

  const meal = assignment.meal ?? "måltiden";
  const message = `Kaninens cykelfest 2026 — Din PIN-kod för värdskapet (${meal}) är: ${assignment.pin}. Logga in på appen under "Mitt värdskap".`;

  const results: { name: string; phone: string; status: string }[] = [];
  for (const p of withPhone) {
    try {
      const phone = p.phone!.replace(/\s/g, "").replace(/^0/, "+46");
      const form = new URLSearchParams();
      form.set("from", "Cykelfest");
      form.set("to", phone);
      form.set("message", message);
      const res = await fetch("https://api.46elks.com/a1/sms", {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });
      const data = await res.json() as { status?: string };
      results.push({ name: p.name, phone, status: data.status ?? "sent" });
    } catch {
      results.push({ name: p.name, phone: p.phone!, status: "error" });
    }
  }

  // Save timestamp of when PIN was sent
  const sentAt = new Date();
  await prisma.hostAssignment.update({ where: { id }, data: { pinSentAt: sentAt } });

  return c.json({ data: { sent: results, pinSentAt: sentAt.toISOString() } });
});

// Set guests for an assignment (replaces all existing guests)
cykelfestRouter.put("/host-assignments/:id/guests", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json(); // { guests: [{ participantName, dietary }] }

  // Fetch the assignment to get meal type and hostNames
  const assignment = await prisma.hostAssignment.findUnique({ where: { id } });
  if (!assignment) return c.json({ error: { message: "Not found" } }, 404);

  // Fetch all participants for dietary and meal-host backfill
  const allParticipants = await prisma.participant.findMany();
  const participantByName = new Map(
    allParticipants.map((p: { name: string; dietary: string | null; id: string }) => [normalizeName(p.name), p])
  );

  // Build guest list, filling dietary from Participant if not provided
  const guestList: { participantName: string; dietary: string | null }[] = (body.guests ?? []).map(
    (g: { participantName: string; dietary?: string | null }) => {
      const matched = participantByName.get(normalizeName(g.participantName ?? "") ?? "");
      return {
        participantName: g.participantName,
        dietary: g.dietary ?? matched?.dietary ?? null,
      };
    }
  );

  // Wrap the destructive operations in a transaction to avoid partial updates
  await prisma.$transaction(async (tx) => {
    // Delete existing guests and replace
    await tx.hostGuest.deleteMany({ where: { assignmentId: id } });
    if (guestList.length > 0) {
      await tx.hostGuest.createMany({
        data: guestList.map((g) => ({
          assignmentId: id,
          participantName: g.participantName,
          dietary: g.dietary,
        })),
      });
    }

    // Auto-populate Participant meal-host fields based on assignment.meal
    if (assignment.meal && assignment.hostNames) {
      const mealField =
        assignment.meal === "Förrätt" ? "forratHost" :
        assignment.meal === "Varmrätt" ? "varmrattHost" :
        assignment.meal === "Efterrätt" ? "efterrattHost" : null;
      if (mealField) {
        for (const g of guestList) {
          const matched = participantByName.get(normalizeName(g.participantName ?? "") ?? "");
          if (matched) {
            await tx.participant.update({
              where: { id: matched.id },
              data: { [mealField]: assignment.hostNames },
            });
          }
        }
      }
    }

    // Touch updatedAt on the parent so the mobile app can detect the change
    await tx.hostAssignment.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
  });

  const updated = await prisma.hostAssignment.findUnique({
    where: { id },
    include: { guests: true },
  });
  return c.json({ data: updated });
});

// ---- IMPORT ----

const TEAM_OPTIONS = ["Charter", "Safari", "Fjällvandring", "Tågluff", "Camping", "Träningsresa", "Backpacking", "Kryssning", "Alpresa", "Club 33"];
const MEAL_OPTIONS = ["Förrätt", "Varmrätt", "Efterrätt"];

// GET /import/template — generate and return .xlsx template
cykelfestRouter.get("/import/template", async (c) => {
  const wb = XLSX.utils.book_new();

  const headers = [
    "Förnamn",
    "Efternamn",
    "Telefon",
    "Lag",
    "Allergier/kost",
    "Värdpar",
    "Måltid (värd)",
    "Adress (värd)",
    "Ankomsttid (värd)",
    "Meddelande från kaninen (värd)",
    "Förrätt hos",
    "Varmrätt hos",
    "Efterrätt hos",
    "Gäst hos (värdskapsnamn)",
    "Uppdrag",
    "Bekräftad",
  ];

  const exampleRows = [
    ["Sara", "Lindqvist", "0701234567", "Charter", "", "Ja", "Förrätt", "Storgatan 1, Uppsala", "15:30", "Välkommen! Ha det kul.", "", "", "", "", "", "Ja"],
    ["Anna", "Svensson", "0709876543", "Safari", "Laktosfri", "Nej", "", "", "", "", "Sara & Magnus Lindqvist", "Björk & Holm", "Eriksson & Co", "Sara & Magnus Lindqvist", "", "Nej"],
    ["Erik", "Karlsson", "0705554433", "Fjällvandring", "Nötallerg", "Nej", "", "", "", "", "Sara & Magnus Lindqvist", "Björk & Holm", "Eriksson & Co", "Sara & Magnus Lindqvist", "Officiell fotograf", ""],
  ];

  const wsData = [headers, ...exampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"] = [
    { wch: 14 }, // Förnamn
    { wch: 18 }, // Efternamn
    { wch: 14 }, // Telefon
    { wch: 16 }, // Lag
    { wch: 20 }, // Allergier
    { wch: 10 }, // Värdpar
    { wch: 14 }, // Måltid (värd)
    { wch: 26 }, // Adress (värd)
    { wch: 16 }, // Ankomsttid
    { wch: 32 }, // Meddelande
    { wch: 26 }, // Förrätt hos
    { wch: 26 }, // Varmrätt hos
    { wch: 26 }, // Efterrätt hos
    { wch: 28 }, // Gäst hos
    { wch: 36 }, // Uppdrag
    { wch: 12 }, // Bekräftad
  ];

  const optionsWs = XLSX.utils.aoa_to_sheet([
    ["Lag-alternativ", "Måltid-alternativ", "Värdpar-alternativ"],
    ...Array.from({ length: Math.max(TEAM_OPTIONS.length, MEAL_OPTIONS.length) }, (_, i) => [
      TEAM_OPTIONS[i] ?? "",
      MEAL_OPTIONS[i] ?? "",
      i === 0 ? "Ja" : i === 1 ? "Nej" : "",
    ]),
  ]);

  XLSX.utils.book_append_sheet(wb, ws, "Deltagare");
  XLSX.utils.book_append_sheet(wb, optionsWs, "Alternativ");

  const rawBuf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const buf = new Uint8Array(rawBuf);

  c.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  c.header("Content-Disposition", 'attachment; filename="cykelfest-mall.xlsx"');
  c.header("Cache-Control", "no-cache");

  return c.body(buf.buffer as ArrayBuffer);
});

// GET /export/participants — export all participants as .xlsx
cykelfestRouter.get("/export/participants", async (c) => {
  // Fetch all participants with their team
  const participants = await prisma.participant.findMany({
    include: { team: true },
  });

  // Fetch all host assignments with guests
  const hostAssignments = await prisma.hostAssignment.findMany({
    include: { guests: true },
  });

  // Build lookup: participantName (lowercase) -> HostAssignment (as host)
  const nameToAssignment = new Map<string, typeof hostAssignments[0]>();
  for (const ha of hostAssignments) {
    const names = ha.hostNames.split(/[&;]/).map((n) => normalizeName(n));
    for (const n of names) nameToAssignment.set(n, ha);
  }

  // Build lookup: participantName (lowercase) -> list of host assignments (as guest)
  const guestToHostMap = new Map<string, typeof hostAssignments[0][]>();
  for (const ha of hostAssignments) {
    for (const g of ha.guests) {
      const key = normalizeName(g.participantName);
      if (!guestToHostMap.has(key)) guestToHostMap.set(key, []);
      guestToHostMap.get(key)!.push(ha);
    }
  }

  // Sort participants: host pairs stay together (grouped by assignment id, ordered by pin),
  // then remaining guests alphabetically.
  // Each host assignment contributes its members as a consecutive block.
  const assignmentOrder = new Map<string, number>();
  hostAssignments
    .slice()
    .sort((a, b) => a.pin.localeCompare(b.pin))
    .forEach((ha, i) => assignmentOrder.set(ha.id, i));

  const participantByNormalizedName = new Map<string, typeof participants[0]>();
  for (const p of participants) participantByNormalizedName.set(normalizeName(p.name), p);

  // Assign sort keys
  type Sortable = { p: typeof participants[0]; sortKey: string };
  const sorted: Sortable[] = participants.map((p) => {
    const ha = nameToAssignment.get(normalizeName(p.name));
    if (ha) {
      const order = assignmentOrder.get(ha.id) ?? 999;
      // Within a pair, sort by position in hostNames string
      const pos = ha.hostNames.split(/[&;]/).findIndex(
        (n) => normalizeName(n) === normalizeName(p.name)
      );
      return { p, sortKey: `A_${String(order).padStart(4, "0")}_${pos}` };
    }
    // Guest: sort alphabetically after all hosts
    return { p, sortKey: `B_${p.name.toLowerCase()}` };
  });
  sorted.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const headers = [
    "Förnamn",
    "Efternamn",
    "Telefon",
    "Lag",
    "Allergier/kost",
    "Värdpar",
    "Värdparskod (PIN)",
    "Måltid (värd)",
    "Adress (värd)",
    "Ankomsttid (värd)",
    "Meddelande från kaninen (värd)",
    "Förrätt hos",
    "Varmrätt hos",
    "Efterrätt hos",
    "Gäst hos (värdskapsnamn)",
    "Uppdrag",
    "Bekräftad",
  ];

  const rows: (string | null)[][] = sorted.map(({ p }) => {
    const nameParts = p.name.trim().split(/\s+/);
    const fornamn = nameParts[0] ?? "";
    const efternamn = nameParts.slice(1).join(" ");

    const ha = nameToAssignment.get(normalizeName(p.name));
    const maltidVard = ha?.meal ?? "";
    const adressVard = ha?.address ?? p.address ?? "";
    const ankomsttidVard = ha?.arrivalTime ?? "";
    const meddelandeVard = ha?.hostNotes ?? "";
    const pin = ha?.pin ?? "";

    const gastHos = (guestToHostMap.get(normalizeName(p.name)) ?? [])[0]?.hostNames ?? "";

    return [
      fornamn,
      efternamn,
      p.phone ?? "",
      p.team?.name ?? "",
      p.dietary ?? "",
      ha ? "Ja" : "Nej",
      pin,
      maltidVard,
      adressVard,
      ankomsttidVard,
      meddelandeVard,
      p.forratHost ?? "",
      p.varmrattHost ?? "",
      p.efterrattHost ?? "",
      gastHos,
      p.mission ?? "",
      p.confirmed ? "Ja" : "Nej",
    ];
  });

  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"] = [
    { wch: 14 }, // Förnamn
    { wch: 18 }, // Efternamn
    { wch: 14 }, // Telefon
    { wch: 16 }, // Lag
    { wch: 20 }, // Allergier/kost
    { wch: 10 }, // Värdpar
    { wch: 16 }, // Värdparskod (PIN)
    { wch: 14 }, // Måltid (värd)
    { wch: 26 }, // Adress (värd)
    { wch: 16 }, // Ankomsttid (värd)
    { wch: 32 }, // Meddelande från kaninen (värd)
    { wch: 26 }, // Förrätt hos
    { wch: 26 }, // Varmrätt hos
    { wch: 26 }, // Efterrätt hos
    { wch: 28 }, // Gäst hos (värdskapsnamn)
    { wch: 36 }, // Uppdrag
    { wch: 12 }, // Bekräftad
  ];

  // AutoFilter on header row so user can sort/filter by any column in Excel
  ws["!autofilter"] = { ref: `A1:Q${rows.length + 1}` };

  XLSX.utils.book_append_sheet(wb, ws, "Deltagare");

  const rawBuf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const buf = new Uint8Array(rawBuf);

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;

  c.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  c.header("Content-Disposition", `attachment; filename="deltagare_${dateStr}.xlsx"`);
  c.header("Cache-Control", "no-cache");

  return c.body(buf.buffer as ArrayBuffer);
});

// POST /import/participants-xlsx — accept a raw .xlsx file upload, parse it and run import
// Supports the "Cykelfest 2026" master spreadsheet format (Algoritm 2026 sheet)
cykelfestRouter.post("/import/participants-xlsx", async (c) => {
  let fileBuffer: ArrayBuffer;
  try {
    fileBuffer = await c.req.arrayBuffer();
  } catch {
    return c.json({ error: { message: "Kunde inte läsa filen" } }, 400);
  }
  if (!fileBuffer || fileBuffer.byteLength === 0) {
    return c.json({ error: { message: "Tom fil" } }, 400);
  }

  let wb: ReturnType<typeof XLSX.read>;
  try {
    wb = XLSX.read(new Uint8Array(fileBuffer), { type: "array" });
  } catch {
    return c.json({ error: { message: "Ogiltig Excel-fil" } }, 400);
  }

  // Find the sheet with participant data — look for a row containing "Förnamn"
  let dataRows: string[][] = [];
  let headerRowIndex = -1;

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    const raw = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" }) as string[][];
    const idx = raw.findIndex(row =>
      row.some(cell => typeof cell === "string" && cell.trim().toLowerCase().replace(/ö/g, "o") === "fornamn")
    );
    if (idx !== -1) {
      headerRowIndex = idx;
      dataRows = raw;
      break;
    }
  }

  if (headerRowIndex === -1 || dataRows.length === 0) {
    return c.json({ error: { message: "Kunde inte hitta kolumnrubriken 'Förnamn' i filen." } }, 400);
  }

  const headers = (dataRows[headerRowIndex] ?? []).map(h => (h ?? "").toString().trim());

  // Build a column-index map by matching header cell content
  const col = (keywords: string[]): number => {
    const idx = headers.findIndex(h => {
      const norm = h.toLowerCase();
      return keywords.some(k => norm.includes(k.toLowerCase()));
    });
    return idx;
  };

  // Column indices based on the real file structure
  const COL = {
    fornamn:       col(["Förnamn", "fornamn"]),
    efternamn:     col(["Efternamn"]),
    telefon:       col(["Telefon"]),
    adress:        col(["Adress", "Gatuadress"]),
    allergier:     col(["Allergi"]),
    intresse:      col(["Intress"]),          // Intressanmälan — Ja/Nej
    bekraftad:     col(["Bekräftat", "Bekraftad"]),
    arrangör2026:  col(["Arrangör 2026", "Arrangör2026"]),
    lag:           col(["AI föreslår Lag", "Lag"]),
    forratHos:     col(["Förrätt hos"]),
    adressForrat:  col(["Adress Förrätt"]),
    vardskapForrat:col(["Värdskap Förrätt"]),
    varmrattHos:   col(["Varmrätt hos"]),
    adressVarmratt:col(["Adress Varmrätt"]),
    vardskapVarmratt:col(["Värdskap Varmrätt"]),
    efterrattHos:  col(["Efterrätt hos"]),
    adressEfterratt:col(["Adress Efterrätt"]),
    vardskapEfterratt:col(["Värdskap Efterrätt"]),
    uppdrag:       col(["Uppdrag"]),
  };

  const getCell = (row: string[], colIdx: number): string =>
    colIdx >= 0 ? (row[colIdx] ?? "").toString().trim() : "";

  // Strip " (VÄRD)" suffix from host name fields and normalize semicolons to " & "
  const cleanHostName = (raw: string): string =>
    raw.replace(/\s*\(VÄRD\)/gi, "").replace(/;/g, " & ").replace(/\s+/g, " ").trim();

  const rows: ImportRow[] = [];

  for (let i = headerRowIndex + 1; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row || !row.some(c => c !== "")) continue;

    const fornamn = getCell(row, COL.fornamn);
    const efternamn = getCell(row, COL.efternamn);
    if (!fornamn && !efternamn) continue;

    // Only import participants who have submitted interest
    const intresse = getCell(row, COL.intresse).toLowerCase();
    if (intresse && intresse !== "ja") continue;

    const lagRaw = getCell(row, COL.lag);
    if (!lagRaw) continue; // skip rows without team assignment

    const arrangör2026 = getCell(row, COL.arrangör2026).toLowerCase() === "ja";

    // Determine which meal this person is hosting (if any)
    const vardskapForrat   = getCell(row, COL.vardskapForrat).toLowerCase() === "ja";
    const vardskapVarmratt = getCell(row, COL.vardskapVarmratt).toLowerCase() === "ja";
    const vardskapEfterratt = getCell(row, COL.vardskapEfterratt).toLowerCase() === "ja";
    const isVärd = vardskapForrat || vardskapVarmratt || vardskapEfterratt || arrangör2026;

    // For host assignment: use their own address + meal type
    let maltid = "";
    let adressVärd = "";
    if (vardskapForrat) { maltid = "Förrätt"; adressVärd = getCell(row, COL.adressForrat); }
    else if (vardskapVarmratt) { maltid = "Varmrätt"; adressVärd = getCell(row, COL.adressVarmratt); }
    else if (vardskapEfterratt) { maltid = "Efterrätt"; adressVärd = getCell(row, COL.adressEfterratt); }

    // Host name as stored in the "Förrätt/Varmrätt/Efterrätt hos" fields contains "Förnamn Efternamn;Partner (VÄRD)"
    // The host name used in HostAssignment is the cleaned version of the relevant cell
    const forratHosRaw   = getCell(row, COL.forratHos);
    const varmrattHosRaw = getCell(row, COL.varmrattHos);
    const efterrattHosRaw = getCell(row, COL.efterrattHos);

    // For the "Förrätt/Varmrätt/Efterrätt hos" fields on the Participant:
    // strip the (VÄRD) tag and keep the pair name for guest lookup
    const forratHost   = forratHosRaw   ? cleanHostName(forratHosRaw)   : "";
    const varmrattHost = varmrattHosRaw ? cleanHostName(varmrattHosRaw) : "";
    const efterrattHost = efterrattHosRaw ? cleanHostName(efterrattHosRaw) : "";

    // The hostNames for HostAssignment = the pair name from the relevant "hos" column
    // This ensures guests can be linked back to the right HostAssignment
    let hostNames = `${fornamn} ${efternamn}`;
    if (vardskapForrat)    hostNames = forratHost;
    else if (vardskapVarmratt)  hostNames = varmrattHost;
    else if (vardskapEfterratt) hostNames = efterrattHost;

    // gastHos = the pair name of the host for the meal this person attends as a guest
    // For hosts themselves, this links them to their own HostAssignment
    const gastHos = isVärd && maltid
      ? hostNames
      : "";

    const telefonVal = getCell(row, COL.telefon);
    const adressVal = adressVärd || getCell(row, COL.adress);

    rows.push({
      fornamn,
      efternamn,
      telefon:      telefonVal,
      lag:          lagRaw,
      allergier:    getCell(row, COL.allergier),
      vardpar:      isVärd ? "ja" : "nej",
      maltid,
      adress:       adressVärd || getCell(row, COL.adress),
      ankomsttid:   "",
      meddelande:   "",
      forratHos:    forratHost,
      varmrattHos:  varmrattHost,
      efterrattHos: efterrattHost,
      gastHos,
      uppdrag:      getCell(row, COL.uppdrag),
      bekraftad:    getCell(row, COL.bekraftad).toLowerCase() === "ja" ? "ja" : "",
      hostNames:    isVärd ? hostNames : undefined,
    });
  }

  if (rows.length === 0) {
    return c.json({ error: { message: "Inga deltagare med intresseanmälan hittades i filen." } }, 400);
  }

  const result = await runImport(rows);
  return c.json({ data: result });
});

type ImportRow = {
  fornamn: string;
  efternamn: string;
  telefon: string;
  lag: string;
  allergier: string;
  vardpar: string;
  maltid: string;
  adress: string;
  ankomsttid: string;
  meddelande: string;
  forratHos: string;
  varmrattHos: string;
  efterrattHos: string;
  gastHos: string;
  uppdrag: string;
  bekraftad: string;
  hostNames?: string; // optional override for HostAssignment.hostNames (pair name)
};

// Shared import logic used by both /import/participants and /import/participants-xlsx
async function runImport(rows: ImportRow[]): Promise<{ imported: number; errors: string[] }> {
  let imported = 0;
  const errors: string[] = [];

  const existingTeams = await prisma.team.findMany();
  const teamCache = new Map<string, string>();
  for (const t of existingTeams) {
    teamCache.set(normalizeName(t.name), t.id);
  }

  const hostAssignments = await prisma.hostAssignment.findMany();
  const hostCache = new Map<string, string>();
  for (const h of hostAssignments) {
    hostCache.set(normalizeName(h.hostNames), h.id);
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const rowNum = i + 2;

    const fornamn = (row.fornamn ?? "").trim();
    const efternamn = (row.efternamn ?? "").trim();
    const telefon = (row.telefon ?? "").trim();
    const lagName = (row.lag ?? "").trim();
    const allergier = (row.allergier ?? "").trim();
    const vardpar = (row.vardpar ?? "").trim().toLowerCase();
    const maltid = (row.maltid ?? "").trim();
    const adress = (row.adress ?? "").trim();
    const ankomsttid = (row.ankomsttid ?? "").trim();
    const meddelande = (row.meddelande ?? "").trim();
    const forratHos = (row.forratHos ?? "").trim();
    const varmrattHos = (row.varmrattHos ?? "").trim();
    const efterrattHos = (row.efterrattHos ?? "").trim();
    const gastHos = (row.gastHos ?? "").trim();
    const uppdrag = (row.uppdrag ?? "").trim();
    const bekraftad = (row.bekraftad ?? "").trim().toLowerCase();

    if (!fornamn || !efternamn) {
      errors.push(`Rad ${rowNum}: Förnamn och efternamn krävs.`);
      continue;
    }

    if (!lagName) {
      errors.push(`Rad ${rowNum}: Lag krävs för ${fornamn} ${efternamn}.`);
      continue;
    }

    let teamId = teamCache.get(normalizeName(lagName));
    if (!teamId) {
      try {
        const newTeam = await prisma.team.create({ data: { name: lagName } });
        teamId = newTeam.id;
        teamCache.set(normalizeName(lagName), teamId);
      } catch (e) {
        errors.push(`Rad ${rowNum}: Kunde inte skapa lag "${lagName}".`);
        continue;
      }
    }

    const fullName = `${fornamn} ${efternamn}`;

    let result: { participant: { id: string; name: string }; newAssignmentId: string | null };
    try {
      result = await prisma.$transaction(async (tx) => {
        // Upsert participant by name — update if exists, create if new
        const existing = await tx.participant.findFirst({ where: { name: fullName } });
        let p: { id: string; name: string };
        if (existing) {
          p = await tx.participant.update({
            where: { id: existing.id },
            data: {
              teamId,
              role: vardpar === "ja" ? "host" : "guest",
              phone: telefon || existing.phone || null,
              dietary: allergier || existing.dietary || null,
              address: adress || existing.address || null,
              confirmed: bekraftad === "ja" || bekraftad === "yes" || bekraftad === "true" ? true : existing.confirmed,
              forratHost: forratHos || null,
              varmrattHost: varmrattHos || null,
              efterrattHost: efterrattHos || null,
              mission: uppdrag || null,
            },
          });
        } else {
          const base = fullName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-åäöé]/g, "");
          const suffix = Math.random().toString(36).slice(2, 7);
          const accessCode = `${base}-${suffix}`;
          p = await tx.participant.create({
            data: {
              name: fullName,
              teamId,
              accessCode,
              role: vardpar === "ja" ? "host" : "guest",
              phone: telefon || null,
              dietary: allergier || null,
              address: adress || null,
              confirmed: bekraftad === "ja" || bekraftad === "yes" || bekraftad === "true",
              forratHost: forratHos || null,
              varmrattHost: varmrattHos || null,
              efterrattHost: efterrattHos || null,
              mission: uppdrag || null,
            },
          });
        }

        let newAssignmentId: string | null = null;

        if (vardpar === "ja") {
          const assignmentHostNames = row.hostNames || fullName;
          // Check if a HostAssignment with this hostNames+meal already exists
          const existingAssignment = await tx.hostAssignment.findFirst({
            where: {
              hostNames: assignmentHostNames,
              meal: maltid || null,
            },
          });
          if (existingAssignment) {
            newAssignmentId = existingAssignment.id;
          } else {
            const pin = await generateHostPin(maltid || null, tx);
            const newAssignment = await tx.hostAssignment.create({
              data: {
                type: "meal",
                pin,
                hostNames: assignmentHostNames,
                address: adress || null,
                meal: maltid || null,
                arrivalTime: ankomsttid || null,
                hostNotes: meddelande || null,
              },
            });
            newAssignmentId = newAssignment.id;
          }
        }

        if (gastHos) {
          const assignmentId = hostCache.get(normalizeName(gastHos)) ?? (newAssignmentId ?? undefined);
          if (assignmentId) {
            // Only create HostGuest if not already linked
            const existingGuest = await tx.hostGuest.findFirst({
              where: { assignmentId, participantName: fullName },
            });
            if (!existingGuest) {
              await tx.hostGuest.create({
                data: { assignmentId, participantName: fullName, dietary: null },
              });
            }
          }
        }

        return { participant: p, newAssignmentId };
      });
    } catch (e) {
      errors.push(`Rad ${rowNum}: Kunde inte importera ${fullName}.`);
      continue;
    }

    if (vardpar === "ja" && result.newAssignmentId) {
      const cacheKey = row.hostNames ? normalizeName(row.hostNames) : normalizeName(fullName);
      hostCache.set(cacheKey, result.newAssignmentId);
    }

    if (gastHos && !hostCache.get(normalizeName(gastHos))) {
      errors.push(`Rad ${rowNum}: Hittade inget värdpar med namnet "${gastHos}" för ${fullName}.`);
    }

    imported++;
  }

  return { imported, errors };
}

// POST /import/participants — import rows from parsed CSV/Excel
cykelfestRouter.post("/import/participants", async (c) => {
  const body = await c.req.json<{ rows: ImportRow[] }>();
  const rows = body.rows ?? [];
  const result = await runImport(rows);
  return c.json({ data: result });
});

// ---- FEEDBACK / ÅTERKOPPLING ----
// POST /feedback — submit feedback
cykelfestRouter.post("/feedback", async (c) => {
  const body = await c.req.json<{ participantId?: string; teamName?: string; q1?: number; q2?: number; q3?: number; q4?: number; comment?: string }>();

  // Guard against duplicate submissions per participant
  if (body.participantId) {
    const existing = await prisma.feedback.findFirst({
      where: { participantId: body.participantId },
    });
    if (existing) {
      return c.json({ error: { message: "Återkoppling redan inskickad", code: "ALREADY_SUBMITTED" } }, 409);
    }
  }

  const feedback = await prisma.feedback.create({
    data: {
      participantId: body.participantId ?? null,
      teamName: body.teamName ?? null,
      q1: body.q1 ?? null,
      q2: body.q2 ?? null,
      q3: body.q3 ?? null,
      q4: body.q4 ?? null,
      comment: body.comment?.trim() || null,
    },
  });
  return c.json({ data: feedback }, 201);
});

// GET /feedback — get all feedback (admin)
cykelfestRouter.get("/feedback", async (c) => {
  const feedback = await prisma.feedback.findMany({
    orderBy: { submittedAt: "desc" },
  });
  return c.json({ data: feedback });
});

// DELETE /feedback/all — delete all feedback (admin reset)
cykelfestRouter.delete("/feedback/all", async (c) => {
  await prisma.feedback.deleteMany({});
  return new Response(null, { status: 204 });
});

// DELETE /feedback/by-participant/:participantId — delete feedback for a specific participant (admin reset)
cykelfestRouter.delete("/feedback/by-participant/:participantId", async (c) => {
  const participantId = c.req.param("participantId");
  await prisma.feedback.deleteMany({ where: { participantId } });
  return new Response(null, { status: 204 });
});

// ---- FEEDBACK QUESTIONS / ÅTERKOPPLINGSFRÅGOR ----

const DEFAULT_FEEDBACK_QUESTIONS: { position: number; question: string; options: string[] }[] = [
  {
    position: 1,
    question: "Hur var kvällen som helhet?",
    options: ["Fantastisk", "Mycket bra", "Bra", "Okej", "Kunde varit bättre"],
  },
  {
    position: 2,
    question: "Hur trivdes du med ditt lag?",
    options: ["Perfekt lagkemi", "Bra stämning", "Okej", "Lite trögt", "Ville byta lag"],
  },
  {
    position: 3,
    question: "Skulle du vilja komma tillbaka nästa år?",
    options: ["Ja, absolut!", "Troligtvis ja", "Vet inte", "Troligtvis inte"],
  },
  {
    position: 4,
    question: "Hur lagom svårt var ert uppdrag? (om ni hade ett)",
    options: ["Lagom utmanande", "Lite för enkelt", "Lite för svårt", "Vi hade inget uppdrag"],
  },
];

type FeedbackQuestionRow = {
  id: string;
  position: number;
  question: string;
  options: string[];
};

function parseFeedbackQuestion(row: { id: string; position: number; question: string; options: string }): FeedbackQuestionRow {
  return {
    id: row.id,
    position: row.position,
    question: row.question,
    options: JSON.parse(row.options) as string[],
  };
}

// GET /feedback/questions — get all 4 questions (auto-seeds defaults if none exist)
cykelfestRouter.get("/feedback/questions", async (c) => {
  const count = await prisma.feedbackQuestion.count();
  if (count === 0) {
    await prisma.feedbackQuestion.createMany({
      data: DEFAULT_FEEDBACK_QUESTIONS.map((q) => ({
        position: q.position,
        question: q.question,
        options: JSON.stringify(q.options),
      })),
    });
  }
  const questions = await prisma.feedbackQuestion.findMany({
    orderBy: { position: "asc" },
  });
  return c.json({ data: questions.map(parseFeedbackQuestion) });
});

const UpsertFeedbackQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      position: z.number().int().min(1).max(4),
      question: z.string().min(1),
      options: z.array(z.string().min(1)).min(1),
    })
  ).min(1),
});

// PUT /feedback/questions — upsert all 4 questions at once
cykelfestRouter.put("/feedback/questions", async (c) => {
  const body = await c.req.json();
  const parsed = UpsertFeedbackQuestionsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { message: "Ogiltig data", details: parsed.error.flatten() } }, 400);
  }

  const updated: FeedbackQuestionRow[] = [];
  for (const item of parsed.data.questions) {
    const row = await prisma.feedbackQuestion.upsert({
      where: { position: item.position },
      update: {
        question: item.question,
        options: JSON.stringify(item.options),
      },
      create: {
        position: item.position,
        question: item.question,
        options: JSON.stringify(item.options),
      },
    });
    updated.push(parseFeedbackQuestion(row));
  }

  updated.sort((a, b) => a.position - b.position);
  return c.json({ data: updated });
});

// ---- VIDEOS ----

const CreateVideoSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  durationSeconds: z.number().int().positive().optional(),
});

// GET /videos — list all videos, newest first
cykelfestRouter.get("/videos", async (c) => {
  const videos = await prisma.video.findMany({
    orderBy: { publishedAt: "desc" },
  });
  return c.json({ data: videos });
});

// POST /videos — add a new video
cykelfestRouter.post("/videos", async (c) => {
  const body = await c.req.json();
  const parsed = CreateVideoSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { message: "Ogiltig data", details: parsed.error.flatten() } }, 400);
  }
  const video = await prisma.video.create({ data: parsed.data });
  return c.json({ data: video }, 201);
});

// DELETE /videos/:id — ta bort en video
cykelfestRouter.delete("/videos/:id", async (c) => {
  const id = c.req.param("id");
  await prisma.video.delete({ where: { id } });
  return c.json({ data: { ok: true } });
});

// ---- SEED DATA (for testing) ----
// /seed endpoint removed for production security

