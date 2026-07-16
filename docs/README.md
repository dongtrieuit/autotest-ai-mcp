# Documentation Overview

This repository provides an **AutoTest AI** platform that integrates a **Model Context Protocol (MCP) Server** with a web frontend to generate, compile, and execute automated UI test cases using Puppeteer.

## Directory Structure
```
autotest-ai-mcp/
├─ docs/                # Project documentation
│   ├─ README.md        # ✨ This overview (generated)
│   ├─ deployment.md    # Docker build & deployment guide
│   ├─ api.md           # API reference
│   └─ mcp.md           # MCP integration guide
├─ .agents/             # Customizable agent skills
│   └─ skills/
│       └─ mcp-management/
│           └─ SKILL.md # Skill definition for MCP management
├─ src/                 # Source code
├─ public/              # Frontend assets
└─ ...
```

## Getting Started
1. **Setup** – Follow the steps in `docs/deployment.md` to build and run the Docker image.
2. **API Reference** – See `docs/api.md` for all HTTP endpoints.
3. **MCP Integration** – Detailed MCP server configuration is described in `docs/mcp.md`.
4. **Skill Usage** – The `mcp-management` skill (see `.agents/skills/mcp-management/SKILL.md`) can be loaded by agents to automate common MCP tasks such as generating test files, running test cases, and producing reports.

---
*All documentation is written in Vietnamese to match the project’s primary language.*
