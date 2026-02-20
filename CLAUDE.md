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
- `packages/logger/` - Structured logging framework

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

## Logging

AutoBoard uses a unified logging framework (`@autoboard/logger`) across all packages and applications.

### Usage

```typescript
import { getLogger } from "@autoboard/logger";

const logger = getLogger("MyComponent");

logger.error("Error message", error);  // Errors to stderr
logger.warn("Warning message");         // Warnings to stderr
logger.info("Info message");            // Info to stdout
logger.debug("Debug message");          // Debug to stdout (hidden by default)
```

### Log Levels

The logger supports four levels (in order of verbosity):

| Level | Description | Default |
|-------|-------------|---------|
| `debug` | Detailed debugging information | Hidden |
| `info` | General informational messages | **Shown** |
| `warn` | Warning messages | Shown |
| `error` | Error messages | Shown |

### Configuration

**Backend (Node.js):**
Set the `LOG_LEVEL` environment variable:
```bash
LOG_LEVEL=debug npm run dev  # Show all logs
LOG_LEVEL=error npm run dev  # Show only errors
```

**Frontend (Browser):**
Set `window.LOG_LEVEL` at runtime or `VITE_LOG_LEVEL` at build time:
```javascript
window.LOG_LEVEL = 'debug';  // Runtime override
```

### Log Format

**Backend:** `2025-02-20T10:30:45.123Z [info] MyComponent: Message here`

**Frontend:** `[MyComponent] Message here` (uses browser console methods)
