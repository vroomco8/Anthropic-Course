# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # First-time setup: install deps, generate Prisma client, run migrations
npm run dev          # Development server with Turbopack
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest test suite
npm run db:reset     # Reset SQLite database
```

Run a single test file: `npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx`

## Environment

- `ANTHROPIC_API_KEY` — Optional. Without it, the app uses a `MockLanguageModel` that returns static examples (Counter, Form, Card components).
- `JWT_SECRET` — Defaults to `"development-secret-key"` in dev.

## Architecture

UIGen is a Next.js 15 (App Router) AI-powered React component generator with a three-panel layout: chat, preview, and code editor.

### Request Flow

1. User enters a prompt → `ChatProvider` (wraps Vercel AI SDK's `useChat`) sends messages + serialized VFS to `/api/chat`
2. API route reconstructs `VirtualFileSystem`, calls Claude via `streamText()` with two tools
3. Claude responds by calling tools to create/modify files; tool results stream back to the client
4. `FileSystemProvider` applies file changes to the in-memory VFS
5. `PreviewFrame` detects changes, Babel-transforms JSX, and re-renders in an iframe using esm.sh as CDN

### Key Abstractions

**Virtual File System** (`src/lib/file-system.ts`) — All files are in-memory. No disk I/O during generation. The VFS is serialized to JSON and sent with every chat request; the API route deserializes it to reconstruct state server-side. For logged-in users, the project (messages + files) is persisted to SQLite via Prisma on completion.

**Claude Tools** (`src/lib/tools/`)
- `str_replace_editor` — Create or modify files (view, create, str_replace, insert operations)
- `file_manager` — Rename or delete files/folders

**Language Model Provider** (`src/lib/provider.ts`) — Returns `anthropic("claude-haiku-4-5")` if `ANTHROPIC_API_KEY` is set, otherwise a `MockLanguageModel`. The model is configured with prompt caching via ephemeral tokens in the system prompt (`src/lib/prompts/generation.tsx`).

**Preview** (`src/components/preview/PreviewFrame.tsx`) — Generates an import map pointing to esm.sh, Babel-transforms all JSX files, injects them into an iframe. Entry point auto-detection looks for `App.jsx`, `index.jsx`, etc. The `@/` import alias resolves to other virtual files.

**Authentication** — JWT-based (jose), stored in HTTP-only cookies, 7-day expiry. Server actions in `src/actions/` handle sign-up, sign-in, sign-out, and project CRUD. Anonymous users' work is tracked in localStorage via `src/lib/anon-work-tracker.ts` and can be saved on sign-up.

### Context Providers

- `FileSystemProvider` — VFS state, selected file, file operation handlers
- `ChatProvider` — Chat state, tool call processing, bridges Vercel AI SDK to the VFS

Both providers wrap `MainContent` (`src/app/main-content.tsx`), which owns the resizable panel layout.

### Database

SQLite via Prisma. Two models: `User` (email + hashed password) and `Project` (belongs to User, stores `messages` and `files` as JSON strings).

### Tech Stack

Next.js 15, React 19, TypeScript, Tailwind CSS v4, Radix UI, Monaco Editor, Vercel AI SDK, Anthropic SDK, Prisma/SQLite, Vitest + Testing Library.
