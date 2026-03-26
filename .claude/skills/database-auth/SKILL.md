# database-auth skill

Set up Prisma (SQLite) + Better Auth for user accounts and persistent data in this project.

## Stack
- Runtime: Bun
- Framework: Hono
- ORM: Prisma with SQLite (`DATABASE_URL="file:./dev.db"`)
- Auth: Better Auth

## Setup steps

### 1. Install packages
```bash
cd backend
bun add prisma @prisma/client better-auth
bunx prisma init --datasource-provider sqlite
```

### 2. Schema (backend/prisma/schema.prisma)
Add Better Auth tables plus your own models:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Better Auth required tables
model User {
  id            String    @id
  name          String
  email         String    @unique
  emailVerified Boolean
  image         String?
  createdAt     DateTime
  updatedAt     DateTime
  sessions      Session[]
  accounts      Account[]
}

model Session {
  id        String   @id
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime
  updatedAt DateTime
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                    String    @id
  userId                String
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime
  updatedAt             DateTime
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Verification {
  id         String    @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime?
  updatedAt  DateTime?
}
```

### 3. Better Auth config (backend/src/auth.ts)
```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";
import { env } from "./env.js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  baseURL: env.BACKEND_URL,
  emailAndPassword: { enabled: true },
  trustedOrigins: [
    "http://localhost:*",
    "http://127.0.0.1:*",
  ],
});
```

### 4. Mount auth routes (backend/src/index.ts)
```typescript
import { auth } from "./auth.js";

app.on(["GET", "POST"], "/api/auth/**", (c) => auth.handler(c.req.raw));
```

### 5. Prisma client (backend/src/prisma.ts)
```typescript
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();
```

### 6. Mobile auth client (mobile/src/lib/auth.ts)
```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_BACKEND_URL!,
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

### 7. Push schema
```bash
cd backend
bunx prisma db push
```

## Key rules
- Always set `baseURL: env.BACKEND_URL` in Better Auth config
- CORS trustedOrigins must be strings with `*` wildcards, NOT RegExp objects
- Use `bunx prisma db push` in dev, `bunx prisma migrate deploy` in production
- After `bun add`, commit `package.json` and `bun.lock` immediately
