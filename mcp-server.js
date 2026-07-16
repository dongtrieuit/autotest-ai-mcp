#!/usr/bin/env node

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
            {
              name: "create_project",
              description: "Create a new project.",
              inputSchema: {
                type: "object",
                properties: {
                  name: { type: "string", description: "The name of the project." },
                  baseUrl: { type: "string", description: "The base URL for tests (optional)." },
                  description: { type: "string", description: "Optional project description." },
                },
                required: ["name"],
              },
            },
            {
              name: "create_screen",
              description: "Create a new screen under a specific project.",
              inputSchema: {
                type: "object",
                properties: {
                  projectId: { type: "number", description: "The ID of the parent project." },
                  name: { type: "string", description: "The name of the screen." },
                  description: { type: "string", description: "Optional screen description." },
                },
                required: ["projectId", "name"],
              },
            },
            {
              name: "create_test_case",
              description: "Create a new test case under a screen.",
              inputSchema: {
                type: "object",
                properties: {
                  screenId: { type: "number", description: "The ID of the parent screen." },
                  name: { type: "string", description: "The name of the test case." },
                  description: { type: "string", description: "Optional test case description." },
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                    description: "Optional priority level.",
                  },
                },
                required: ["screenId", "name"],
              },
            },
            {
              name: "create_test_step",
              description: "Add a step to a test case.",
              inputSchema: {
                type: "object",
                properties: {
                  testCaseId: { type: "number", description: "The ID of the parent test case." },
                  stepOrder: { type: "number", description: "The execution order index (1-based)." },
                  stepType: {
                    type: "string",
                    enum: ["ASSERT", "ACTION", "INPUT", "INFO", "GET_OTP"],
                    description: "The type of the step.",
                  },
                  action: { type: "string", description: "The action to perform (e.g., 'click', 'type')." },
                  selector: { type: "string", description: "Optional DOM selector target." },
                  value: { type: "string", description: "Optional value input (e.g., typed text)." },
                  expected: { type: "string", description: "Optional expected assertion string." },
                  expectedJson: { type: "object", description: "Optional expected JSON object for assertion." },
                  description: { type: "string", description: "Optional step description." },
                  url: { type: "string", description: "Optional URL for navigation or verification." },
                  otpProviderId: { type: "number", description: "Optional OTP provider ID." },
                },
                required: ["testCaseId", "stepOrder", "stepType"],
              },
            },
            {
              name: "get_project_data_config",
              description: "Get all data variables (testcase_data_config) for a project.",
              inputSchema: {
                type: "object",
                properties: {
                  projectId: { type: "number", description: "The unique ID of the project." },
                },
                required: ["projectId"],
              },
            },
            {
              name: "update_project_data_config",
              description: "Update the entire data variables (testcase_data_config) object for a project.",
              inputSchema: {
                type: "object",
                properties: {
                  projectId: { type: "number", description: "The unique ID of the project." },
                  dataConfig: { type: "object", description: "The complete key-value variables JSON object." },
                },
                required: ["projectId", "dataConfig"],
              },
            },
            {
              name: "set_project_data_config_key",
              description: "Set or update a single variable key-value pair in a project's data config.",
              inputSchema: {
                type: "object",
                properties: {
                  projectId: { type: "number", description: "The unique ID of the project." },
                  key: { type: "string", description: "The variable name." },
                  value: { type: "string", description: "The value to assign to the variable." },
                },
                required: ["projectId", "key", "value"],
              },
            },
            {
              name: "delete_project_data_config_key",
              description: "Delete a single variable key from a project's data config.",
              inputSchema: {
                type: "object",
                properties: {
                  projectId: { type: "number", description: "The unique ID of the project." },
                  key: { type: "string", description: "The variable name to delete." },
                },
                required: ["projectId", "key"],
              },
            },
            {
              name: "generate_test_file",
              description: "Compile and generate the executable Puppeteer script for a test case from its steps.",
              inputSchema: {
                type: "object",
                properties: {
                  testCaseId: { type: "number", description: "The ID of the parent test case." },
                  testName: { type: "string", description: "The name of the test case." },
                  steps: {
                    type: "array",
                    description: "List of step objects to compile into the test case.",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", description: "Optional step ID." },
                        step_order: { type: "number", description: "Execution order index (1-based)." },
                        step_type: { type: "string", enum: ["ASSERT", "ACTION", "INPUT", "INFO", "GET_OTP"], description: "The step type." },
                        action: { type: "string", description: "Action name (e.g., 'click', 'type', 'navigate')." },
                        selector: { type: "string", description: "Selector string or stringified JSON." },
                        value: { type: "string", description: "Input value or configuration." },
                        expected: { type: "string", description: "Expected assertion text." },
                        url: { type: "string", description: "URL path/value." },
                        otp_provider_id: { type: "number", description: "Optional OTP provider ID." }
                      },
                      required: ["step_order", "step_type"]
                    }
                  }
                },
                required: ["testCaseId", "testName", "steps"]
              }
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

    case "create_project": {
      const { name, baseUrl: inputBaseUrl, description } = args || {};
      if (!name) throw new Error("name is required");
      return makeRequest("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name, base_url: inputBaseUrl, description }),
      });
    }

    case "create_screen": {
      const { projectId, name, description } = args || {};
      if (!projectId) throw new Error("projectId is required");
      if (!name) throw new Error("name is required");
      return makeRequest("/api/screens", {
        method: "POST",
        body: JSON.stringify({ project_id: projectId, name, description }),
      });
    }

    case "create_test_case": {
      const { screenId, name, description, priority } = args || {};
      if (!screenId) throw new Error("screenId is required");
      if (!name) throw new Error("name is required");
      return makeRequest("/api/test-cases", {
        method: "POST",
        body: JSON.stringify({ screen_id: screenId, name, description, priority }),
      });
    }

    case "create_test_step": {
      const {
        testCaseId,
        stepOrder,
        stepType,
        action,
        selector,
        value,
        expected,
        expectedJson,
        description,
        url,
        otpProviderId,
      } = args || {};
      if (!testCaseId) throw new Error("testCaseId is required");
      if (stepOrder === undefined) throw new Error("stepOrder is required");
      if (!stepType) throw new Error("stepType is required");

      return makeRequest("/api/test-steps", {
        method: "POST",
        body: JSON.stringify({
          test_case_id: testCaseId,
          step_order: stepOrder,
          step_type: stepType,
          action,
          selector,
          value,
          expected,
          expected_json: expectedJson,
          description,
          url,
          otp_provider_id: otpProviderId,
        }),
      });
    }

    case "get_project_data_config": {
      const { projectId } = args || {};
      if (!projectId) throw new Error("projectId is required");
      const res = await makeRequest(`/api/projects/${projectId}/data-config`);
      return res.data || res;
    }

    case "update_project_data_config": {
      const { projectId, dataConfig } = args || {};
      if (!projectId) throw new Error("projectId is required");
      if (!dataConfig) throw new Error("dataConfig is required");
      const res = await makeRequest(`/api/projects/${projectId}/data-config`, {
        method: "PUT",
        body: JSON.stringify({ data_config: dataConfig }),
      });
      return res.data || res;
    }

    case "set_project_data_config_key": {
      const { projectId, key, value } = args || {};
      if (!projectId) throw new Error("projectId is required");
      if (!key) throw new Error("key is required");
      const res = await makeRequest(`/api/projects/${projectId}/data-config`, {
        method: "PATCH",
        body: JSON.stringify({ key, value }),
      });
      return res.data || res;
    }

    case "delete_project_data_config_key": {
      const { projectId, key } = args || {};
      if (!projectId) throw new Error("projectId is required");
      if (!key) throw new Error("key is required");
      const res = await makeRequest(`/api/projects/${projectId}/data-config/${key}`, {
        method: "DELETE",
      });
      return res.data || res;
    }

    case "generate_test_file": {
      const { testCaseId, testName, steps } = args || {};
      if (!testCaseId) throw new Error("testCaseId is required");
      if (!testName) throw new Error("testName is required");
      if (!steps || !Array.isArray(steps)) throw new Error("steps must be an array");

      const res = await makeRequest("/api/execution/generate", {
        method: "POST",
        body: JSON.stringify({ testCaseId, testName, steps }),
      });
      return res.data || res;
    }

    default:
      throw new Error(`Tool ${name} not found`);
  }
}

console.error(`Autotest AI MCP Server starting with base URL: ${baseUrl}...`);
