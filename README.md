# Autotest AI Model Context Protocol (MCP) Server

This is a standalone Model Context Protocol (MCP) server that exposes Autotest AI project and test management capabilities to LLM clients such as Claude Desktop or Cursor.

## Features

Exposes the following tools to your AI agent:
- `list_projects`: Lists all projects.
- `list_screens`: Lists screens under a project.
- `list_test_cases`: Lists test cases.
- `get_test_case_details`: Fetches steps and metadata for a specific test case.
- `get_latest_test_runs`: Shows recent test run execution status.
- `run_test_case`: Triggers a test execution run.
- `create_project`: Creates a new project.
- `create_screen`: Creates a new screen under a project.
- `create_test_case`: Creates a new test case under a screen.
- `create_test_step`: Adds a step to a test case.

## Setup Instructions

### 1. Installation

Install project dependencies:

```bash
npm install
```

### 2. Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Update `.env` with your Autotest AI URL and API Key:
   ```env
   AUTOTEST_AI_URL=http://localhost:3000
   AUTOTEST_AI_API_KEY=your_actual_api_key
   ```
   *(You can generate an API key from the Profile page in the Autotest AI Web UI).*

### 3. Integration with LLM Clients

#### Claude Desktop

Add the following to your `claude_desktop_config.json` (typically located at `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "autotest-ai-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/autotest-ai-mcp/mcp-server.js"],
      "env": {
        "AUTOTEST_AI_URL": "http://localhost:3000",
        "AUTOTEST_AI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### Cursor

1. Go to **Settings > Features > MCP**.
2. Click **+ Add New MCP Server**.
3. Configure:
   - **Name**: `autotest-ai-mcp`
   - **Type**: `stdio`
   - **Command**: `node /absolute/path/to/autotest-ai-mcp/mcp-server.js`
4. Add environment variables if needed:
   - `AUTOTEST_AI_URL`: `http://localhost:3000`
   - `AUTOTEST_AI_API_KEY`: `your_api_key_here`

## Running locally

You can test the JSON-RPC communication using stdio:

```bash
npm start
```
