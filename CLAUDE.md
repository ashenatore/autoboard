# AutoBoard

AI-powered Kanban board that uses Claude to automatically execute development tasks.

## Tech Stack

- **Backend**: Node.js, Hono framework, SQLite + Drizzle ORM
- **Frontend**: React 18, Vite, Jotai state management
- **AI**: Claude API via official SDK with MCP tool calling
- **Monorepo**: pnpm workspaces with TypeScript

## Project Structure

This is a monorepo with the following packages:

- `apps/api/` - HTTP REST API backend
- `apps/web/` - React frontend application
- `packages/db/` - Database layer (SQLite + Drizzle)
- `packages/domain/` - Business logic use cases
- `packages/services/` - External integrations (Claude, MCP)
- `packages/shared/` - Shared types and errors

## Architecture

The application follows clean architecture principles:

1. **API Layer** - HTTP endpoints with Hono
2. **Domain Layer** - Use cases for business operations
3. **Services Layer** - External API integrations
4. **Data Layer** - Repository pattern with Drizzle ORM
5. **Shared Layer** - Common types and errors

## Key Features

- **Kanban Board**: Drag-and-drop task management with columns (todo, in-progress, manual-review, done)
- **AI Execution**: Cards are executed by Claude with full tool access
- **Real-time Logs**: Server-Sent Events for live execution logs
- **Auto Mode**: Automatic card execution with configurable concurrency
- **Plan Generation**: AI-powered task breakdown from feature descriptions
- **Session Resumption**: Cards can resume from previous sessions

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run API server (port 3001)
cd apps/api && npm run dev

# Run web dev server (port 3000 with gateway)
cd apps/web && npm run dev
```

### Database

```bash
cd packages/db

# Generate migrations from schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema directly (dev only)
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

## Codebase Map

For detailed architecture documentation, see [docs/CODEBASE_MAP.md](docs/CODEBASE_MAP.md).

## Important Notes

- All packages use ESM (`"type": "module"`)
- Database uses SQLite with no foreign keys (logical relationships only)
- Card execution state is in-memory only (lost on restart)
- Auto-mode polling runs every 3 seconds
- Claude provider uses `bypassPermissions` by default
