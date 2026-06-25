# Electron + Vite + tRPC + TypeScript + Backend Hot Reload

A modern Electron starter template built with:

- Electron
- Vite
- React
- TypeScript
- tRPC
- IPC-based transport
- Backend worker hot reloading

## Features

- Fast React development with Vite HMR
- Type-safe communication using tRPC
- Electron preload isolation
- Backend logic executed in a dedicated worker process
- Automatic backend reloads without restarting the Electron window
- Clean separation between UI, Electron, and backend layers

## Project Structure

```txt
src/
├── electron/
│   ├── main.ts
│   ├── preload.cts
│   └── trpc.ts
│
├── backend/
│   ├── worker.ts
│   ├── trpc.ts
│   ├── router/
│   ├── logic/
│   └── lib/
│
├── shared/
│   └── types.ts
│
└── ui/
    ├── App.tsx
    ├── main.tsx
    └── trpcClient.ts
```

## Architecture

```txt
React UI
    │
    ▼
tRPC Client
    │
    ▼
IPC Renderer
    │
    ▼
Electron Main Process
    │
    ▼
Backend Worker
    │
    ▼
tRPC Router
    │
    ▼
Business Logic
```

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd <repository-name>
```

Install dependencies:

```bash
npm install
```

## Development

Start the development environment:

```bash
npm run dev
```

This will:

- Start the Vite development server
- Compile Electron and backend TypeScript files
- Launch Electron
- Watch backend files for changes
- Restart only the backend worker when backend code changes

## Hot Reload Behavior

### Frontend

Changes inside:

```txt
src/ui/**
```

are handled by Vite HMR and update instantly.

### Backend

Changes inside:

```txt
src/backend/**
```

automatically restart the worker process.

The Electron window remains open and the renderer is not reloaded.

## Creating a tRPC Procedure

Example:

```ts
export const appRouter = t.router({
  hello: t.procedure
    .input((input) => input as { name: string })
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.name}`
      };
    })
});
```

## Calling Procedures From React

```ts
const result = await trpcClient.hello.query({
  name: "World"
});

console.log(result.greeting);
```

## Build

Create a production build:

```bash
npm run build
```

## Notes

- The renderer never communicates directly with backend code.
- All communication passes through Electron IPC.
- Backend code is isolated inside a worker process.
- Worker restarts do not close or reload the Electron window.
- Router types are shared automatically through TypeScript.

```

```
