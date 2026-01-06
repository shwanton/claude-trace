# Claude Code Instructions

## Project Overview
claude-trace is a Node.js CLI tool that records all Claude Code interactions, exposing system prompts, tool outputs, and raw API data in an interactive HTML viewer.

## Development Commands
```bash
npm install          # Install dependencies
npm run dev          # Start dev mode with file watching
npm run build        # Build everything (backend + frontend)
npm run build:backend   # Build CLI and interceptor only
npm run build:frontend  # Build web interface only
```

## Testing
```bash
node --no-deprecation dist/cli.js     # Test compiled version
npx tsx --no-deprecation src/cli.ts   # Test TypeScript source directly
```

## Architecture
- **Backend** (`src/`): CLI, interceptor, HTML generator, index generator
- **Frontend** (`frontend/src/`): Web interface components and utilities

### Key Files
- `src/cli.ts` - Command-line interface entry point
- `src/interceptor.ts` - Intercepts fetch() calls in Claude Code
- `src/html-generator.ts` - Creates self-contained HTML reports
- `src/index-generator.ts` - AI-powered conversation summaries
- `frontend/src/app.ts` - Main frontend application component

## Output
Logs are saved to `.claude-trace/log-YYYY-MM-DD-HH-MM-SS.{jsonl,html}`

## Guidelines
- Always read README.md at the beginning of a session
- Run `npm run build` after making changes to verify compilation
- Use `npm run dev` for active development with file watching
- Frontend dev server available at `http://localhost:8080/test`
