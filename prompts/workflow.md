---
description: Run a request under the evidence-driven engineering workflow
argument-hint: "<request>"
---

This command explicitly activates the Agent Workflow dispatcher for the request below.

Read `~/.pi/agent/skills/agent-workflow/SKILL.md` first and follow its bootstrap. The skill decides whether the request remains on the compact branch or enters the normal workflow. When the normal branch applies, `~/.pi/agent/workflow/global-workflow.md` is the normative semantic source of truth and `~/.pi/agent/AGENTS.md` supplies only the Pi-specific runtime binding.

Do not infer workflow phases from particular SubAgent names. Preserve the workflow's required boundaries and gates, then choose the current Pi-native execution mechanism and model that satisfy each bounded job.

Request:
$@
