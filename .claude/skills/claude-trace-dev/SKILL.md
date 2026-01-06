---
name: claude-trace-dev
description: Run claude-trace from the local development repo. Use when starting a traced Claude Code session, testing local claude-trace builds, or when user says "start tracing", "run claude-trace", "traced session", or mentions claude-trace development.
---

# claude-trace Local Development Runner

Run the local development build of claude-trace to record Claude Code interactions.

## Quick Start

```bash
node /Users/shwanton/Projects/claude/shwanton_claude-trace/dist/cli.js
```

## Available Flags

| Flag | Description |
|------|-------------|
| `--open-on-start` | Open HTML viewer immediately when trace starts (auto-refreshes) |
| `--browser NAME` | Specify browser: `default`, `chrome`, `firefox`, `safari`, `edge`, `brave`, `arc`, or custom path |
| `--log NAME` | Custom log file base name (without extension) |
| `--no-open` | Don't open browser when session ends |
| `--run-with ARGS` | Pass arguments to Claude process |

## Common Commands

### Start with auto-open in Safari (recommended)
```bash
node /Users/shwanton/Projects/claude/shwanton_claude-trace/dist/cli.js --open-on-start --browser safari
```

### Start with Chrome
```bash
node /Users/shwanton/Projects/claude/shwanton_claude-trace/dist/cli.js --open-on-start --browser chrome
```

### Start with default browser
```bash
node /Users/shwanton/Projects/claude/shwanton_claude-trace/dist/cli.js --open-on-start
```

### Start without auto-open (opens on exit)
```bash
node /Users/shwanton/Projects/claude/shwanton_claude-trace/dist/cli.js
```

### Custom log name
```bash
node /Users/shwanton/Projects/claude/shwanton_claude-trace/dist/cli.js --log my-session --open-on-start
```

## Output Location

Logs are saved to: `.claude-trace/log-YYYY-MM-DD-HH-MM-SS.{jsonl,html}`

## Development Workflow

Before running, ensure the project is built:
```bash
cd /Users/shwanton/Projects/claude/shwanton_claude-trace && npm run build
```

## Notes

- Safari respects background opening (no focus steal)
- Chrome may steal focus when opening
- The `--open-on-start` flag enables real-time monitoring as the HTML auto-refreshes
