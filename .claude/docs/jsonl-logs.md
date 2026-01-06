# JSONL Logs in claude-trace

## Overview

The JSONL (JSON Lines) logs are the core data storage mechanism in claude-trace. Each line of a JSONL file represents a complete request-response pair from a Claude API interaction, enabling transparent recording of all API calls while maintaining data security.

## What Gets Saved

Each line in the JSONL file is a single JSON object called a **RawPair**, structured as follows:

### RawPair Data Structure

```typescript
{
  request: {
    timestamp: number;              // Unix timestamp in seconds
    method: string;                 // HTTP method (POST, GET, etc.)
    url: string;                    // Full request URL
    headers: Record<string, string>;// Request headers (sensitive ones redacted)
    body: any;                      // Parsed request body
  };
  response: {
    timestamp: number;              // Response timestamp
    status_code: number;            // HTTP status code (200, 400, etc.)
    headers: Record<string, string>;// Response headers
    body?: any;                     // Parsed JSON response body
    body_raw?: string;              // Raw response (for streaming/SSE)
    events?: SSEEvent[];            // Parsed streaming events
  } | null;                         // null for orphaned requests
  logged_at: string;                // ISO timestamp when logged
  note?: string;                    // Optional note
}
```

### Example JSONL Entry

```json
{
  "request": {
    "timestamp": 1704067200.123,
    "method": "POST",
    "url": "https://api.anthropic.com/v1/messages",
    "headers": {
      "content-type": "application/json",
      "authorization": "Bearer sk-ant-...***...abc"
    },
    "body": {
      "model": "claude-3-5-sonnet-20241022",
      "max_tokens": 4096,
      "messages": [
        {
          "role": "user",
          "content": "Hello Claude"
        }
      ],
      "system": "You are a helpful assistant."
    }
  },
  "response": {
    "timestamp": 1704067201.456,
    "status_code": 200,
    "headers": {
      "content-type": "application/json"
    },
    "body": {
      "id": "msg_...",
      "type": "message",
      "role": "assistant",
      "content": [
        {
          "type": "text",
          "text": "Hello! How can I help?"
        }
      ],
      "model": "claude-3-5-sonnet-20241022",
      "usage": {
        "input_tokens": 20,
        "output_tokens": 15
      }
    }
  },
  "logged_at": "2024-01-01T12:00:01.789Z"
}
```

## How JSONL Logs Are Created

### Interception Mechanism

The **interceptor** (`src/interceptor.ts`) injects itself into Claude Code and captures API calls through multiple interception points:

1. **Global `fetch()` Interception** (lines 170-258)
   - Intercepts all fetch() calls made by the Claude Code process
   - Captures request method, URL, headers, and body
   - Captures response status, headers, and body

2. **Node.js HTTP/HTTPS Interception** (lines 260-375)
   - Intercepts `http.request()` and `https.request()` calls
   - Assembles request/response bodies from chunks
   - Handles streaming responses

3. **Orphaned Request Handling** (lines 430-450)
   - Logs requests without responses on process exit
   - Marks with `note: "Request without response"`

### Sensitive Data Redaction

Headers containing sensitive information are redacted before logging:
- `authorization`
- `x-api-key`
- `x-auth-token`
- `cookie` / `set-cookie`
- `x-session-token`
- `x-access-token`
- Bearer tokens and proxy authentication headers

### Logging Storage

Each pair is appended to a JSONL file:

```
Location: .claude-trace/log-YYYY-MM-DD-HH-MM-SS.jsonl
Method: fs.appendFileSync() - real-time appending
Format: One JSON object per line, terminated with newline
```

### Filtering

By default, only "substantial" conversations are logged:
- Only `/v1/messages` API calls
- Only conversations with more than 2 messages

Use `--include-all-requests` flag to log all API calls including:
- Single-message requests
- Other API endpoints
- All Bedrock calls

## How JSONL Logs Are Used

### 1. HTML Report Generation

**File:** `src/html-generator.ts`

The HTML generator processes JSONL files:

```typescript
// Read JSONL file line-by-line
const lines = fs.readFileSync(jsonlFile, "utf-8").split("\n");

// Parse each line as JSON
for (const line of lines) {
  const pair = JSON.parse(line) as RawPair;
  pairs.push(pair);
}

// Process pairs into conversations
const processor = new SharedConversationProcessor();
const conversations = processor.mergeConversations(
  processor.processRawPairs(pairs)
);

// Generate self-contained HTML report with embedded data
```

### 2. Data Processing Pipeline

**File:** `src/shared-conversation-processor.ts`

Raw pairs are processed into enriched data:

**ProcessedPair Creation:**
- Detect if response is streaming (SSE or Bedrock format)
- Parse streaming events into complete Message objects
- Extract model name from request and response
- Calculate token usage and cache information

**Conversation Grouping:**
- Group pairs by system prompt + model
- Identify conversation threads by first user message
- Keep longest conversation per thread
- Detect and merge compact conversations (fast turn-around)

### 3. Frontend Display

**File:** `frontend/src/app.ts`

The frontend application processes JSONL data:

1. **Data Injection:**
   - RawPair array is base64-encoded
   - Embedded into HTML template as window object data

2. **Data Processing:**
   - Frontend decodes base64 data
   - Runs SharedConversationProcessor to create conversations
   - Groups messages by system prompt + model

3. **Display Views:**
   - **Conversations View** - Complete conversations with formatted messages
   - **Raw Calls View** - All HTTP request-response pairs with expandable sections
   - **JSON Debug View** - Processed API data with token count breakdown

## API Calls Logged

### Standard Anthropic API

**Endpoint:** `POST https://api.anthropic.com/v1/messages`

Includes:
- System prompts (detailed instructions given to Claude)
- Messages (user/assistant conversation history)
- Tool definitions (available functions)
- Model name and parameters
- Streaming responses (SSE format)
- Token usage and cache hits/writes

### AWS Bedrock Claude

**Endpoints:** Bedrock runtime invoke endpoints

Includes:
- Binary event streaming format
- Model identifiers (claude-3-5-sonnet-bedrock, etc.)
- Request/response metadata

## Real-Time Features

### Real-Time Logging
- Each pair is written immediately as the response completes
- No buffering - data is persisted right away

### Real-Time HTML Updates
- HTML report is regenerated after each new pair
- Browser can refresh to see new interactions

### Streaming Response Handling
- SSE events are captured and parsed in real-time
- Bedrock binary events are decoded and processed
- Complete Message objects reconstructed from streaming chunks

## Error Handling

### Invalid JSON Lines
- Skipped with warning: "Warning: Skipping invalid JSON on line {N}..."
- File continues processing remaining lines
- Ensures one malformed line doesn't crash the entire report

### Orphaned Requests
- Requests without responses logged on process exit
- Marked with `response: null` and `note: "Request without response"`
- Useful for debugging network issues

### Silent Failures
- Logging errors during runtime are silently caught
- Prevents disruption of Claude Code operation
- Errors are logged via console warnings

## File Size Considerations

### Default Filtering
- Reduces log file size by focusing on meaningful conversations
- Excludes single-message requests
- Excludes non-message endpoints

### JSONL Format Benefits
- Line-delimited allows incremental processing
- Can process files without loading entirely into memory
- Easy to stream and filter

## Viewing JSONL Logs

### Direct File Inspection
```bash
# View raw JSONL content
cat .claude-trace/log-2024-01-01-12-00-00.jsonl

# Pretty-print individual lines
cat .claude-trace/log-2024-01-01-12-00-00.jsonl | jq .

# Count API calls
wc -l .claude-trace/log-2024-01-01-12-00-00.jsonl
```

### HTML Report
```bash
# Generate HTML from JSONL
claude-trace --generate-html log.jsonl report.html

# Generate HTML with all requests
claude-trace --generate-html log.jsonl report.html --include-all-requests

# Open in browser (self-contained, no server needed)
open report.html
```

### Conversation Index
```bash
# Generate AI-powered summaries of all conversations
claude-trace --index

# Creates index.html with searchable conversation listing
```

## Data Security

- **API Keys:** Authorization headers are redacted with asterisks
- **Auth Tokens:** Session tokens and credentials are masked
- **User Data:** Complete request/response bodies are logged (use with care)
- **Local Storage:** Logs stored locally in `.claude-trace/` directory
- **Self-Contained HTML:** No external requests needed to view logs

## Use Cases

1. **Debugging:** Inspect exact system prompts, messages, and tool calls
2. **Analysis:** Understand Claude's reasoning and decision-making
3. **Optimization:** Identify expensive API calls and token usage
4. **Documentation:** See complete conversation history with timestamps
5. **Learning:** Review how Claude handles different tasks and queries
6. **Auditing:** Track all API calls made during development sessions
7. **Performance:** Analyze latency and token usage patterns
