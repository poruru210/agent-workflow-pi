# agent-workflow-pi

Personal Pi configuration repository.

This repository is intended to reproduce my user-level Pi environment under `~/.pi/agent` while keeping runtime state, credentials, sessions, caches, and other machine-local data outside Git.

The configuration will include:

- the rigorous agent workflow derived from the existing `AGENTS.md` / `global-workflow.md` policy;
- dynamic per-job subagent model routing rather than fixed role-to-model assignments;
- user-level Pi agent profiles and orchestration through `pi-agents`;
- MCP connectivity through `pi-mcp-extension`;
- Semble code search as an MCP server;
- local Pi extensions, skills, prompts, and future personal integrations.

The repository is configuration for a personal Pi installation, not a standalone workflow product.
