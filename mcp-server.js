import readline from "readline";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env file in the current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "./.env") });

// Setup base URL and Authorization Token for Autotest-AI API
const baseUrl = process.env.AUTOTEST_AI_URL || "http://localhost:3001";
const token = process.env.AUTOTEST_AI_API_KEY || process.env.AUTOTEST_AI_TOKEN || "";

// Helper function to perform authenticated API calls
async function makeRequest(apiPath, options = {}) {
  const url = `${baseUrl.replace(/\/$/, "")}${apiPath}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Request failed (${res.status}): ${text}`);
  }
  return res.json();
}

// Set up readline interface for stdio JSON-RPC communication
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", async (line) => {
  if (!line.trim()) return;
  try {
    const request = JSON.parse(line);
    const response = await handleRequest(request);
    if (response) {
      process.stdout.write(JSON.stringify(response) + "\n");
    }
  } catch (err) {
    console.error("Error handling JSON-RPC line:", err);
  }
});

async function handleRequest(req) {
  const { method, params, id } = req;

  // If request doesn't have an ID, it's a notification, so we don't respond
  if (id === undefined && method !== "notifications/initialized") {
    return null;
  }

  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "autotest-ai-mcp",
            version: "1.0.0",
          },
        },
      };

    case "notifications/initialized":
      return null;

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: [
            {
              name: "list_projects",
              description: "List all projects configured in the test automation system.",
              inputSchema: { type: "object", properties: {} },
            },
            {
              name: "list_screens",
              description: "List all screens under a specific project by project ID.",
              inputSchema: {
                type: "object",
                properties: {
                  projectId: { type: "number", description: "The unique ID of the project." },
                },
                required: ["projectId"],
              },
            },
            {
              name: "list_test_cases",
              description: "List test cases. Can filter by screen ID.",
              inputSchema: {
                type: "object",
                properties: {
                  screenId: { type: "number", description: "Optional screen ID to filter by." },
                },
              },
            },
            {
              name: "get_test_case_details",
              description: "Get all steps and detailed definitions of a specific test case.",
              inputSchema: {
                type: "object",
                properties: {
                  testCaseId: { type: "number", description: "The unique ID of the test case." },
                },
                required: ["testCaseId"],
              },
            },
            {
              name: "get_latest_test_runs",
              description: "Get recent test execution runs and their status.",
              inputSchema: {
                type: "object",
                properties: {
                  limit: {
                    type: "number",
                    description: "Number of runs to return (default is 5).",
                  },
                },
              },
            },
            {
              name: "run_test_case",
              description: "Trigger the execution queue for a specific test case ID.",
              inputSchema: {
                type: "object",
                properties: {
                  testCaseId: {
                    type: "number",
                    description: "The ID of the test case to execute.",
                  },
                },
                required: ["testCaseId"],
              },
            },
          ],
        },
      };

    case "tools/call": {
      const { name, arguments: args } = params || {};
      try {
        const result = await handleToolCall(name, args);
        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          },
        };
      } catch (err) {
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32603,
            message: `Tool execution failed: ${err.message}`,
          },
        };
      }
    }

    default:
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      };
  }
}

async function handleToolCall(name, args) {
  switch (name) {
    case "list_projects": {
      const res = await makeRequest("/api/projects");
      return res.data || res;
    }

    case "list_screens": {
      const { projectId } = args || {};
      if (!projectId) throw new Error("projectId is required");
      const res = await makeRequest(`/api/screens?project_id=${projectId}`);
      return res.data || res;
    }

    case "list_test_cases": {
      const { screenId } = args || {};
      const pathStr = screenId ? `/api/test-cases?screen_id=${screenId}` : "/api/test-cases";
      const res = await makeRequest(pathStr);
      return res.data || res;
    }

    case "get_test_case_details": {
      const { testCaseId } = args || {};
      if (!testCaseId) throw new Error("testCaseId is required");

      // Fetch metadata and steps
      const caseRes = await makeRequest(`/api/test-cases/${testCaseId}`);
      const stepsRes = await makeRequest(`/api/test-steps?test_case_id=${testCaseId}`);

      const testCase = caseRes.data || caseRes;
      testCase.steps = stepsRes.data || stepsRes;
      return testCase;
    }

    case "get_latest_test_runs": {
      const limit = args?.limit || 5;
      const res = await makeRequest(`/api/test-runs?limit=${limit}`);
      return res.data || res;
    }

    case "run_test_case": {
      const { testCaseId } = args || {};
      if (!testCaseId) throw new Error("testCaseId is required");

      const res = await makeRequest("/api/execution/run-test", {
        method: "POST",
        body: JSON.stringify({ test_case_id: testCaseId }),
      });
      return res.data || res;
    }

    default:
      throw new Error(`Tool ${name} not found`);
  }
}

console.error(`Autotest AI MCP Server starting with base URL: ${baseUrl}...`);
