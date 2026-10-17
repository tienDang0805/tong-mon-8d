---
trigger: always_on
description: "Autonomous execution and concise closeout; packets on request"
---

# Task Completion and Evidence Transfer

1. Follow AGENT_EXECUTION_CONTRACT Section 3: owner + planner choose the task; Argon executes, self-reviews, checks and syncs affected docs; the planner consumes the result and plans forward. Routine independent ChatGPT review is not a required gate.
2. An owner-issued EXECUTE card authorizes its scope. Respect PLAN_ONLY, exact allowlists and the explicit commit policy. Carry forward authorization; do not ask again for each internal step or routine correction. Templates or old reports do not authorize execution.
3. Select checks by actual impact. Reuse passing evidence with unchanged relevant inputs and its original identity. Docs-only changes do not require game tests/build/E2E. Required-but-unrun checks remain NOT_RUN or blocked.
4. Return one concise outcome report with scope, commit/remote state, actual check evidence, documentation updates and concrete remaining decisions. Do not dump full source or logs into chat.
5. ZIP export is not required for routine PLAN, execution, DOC SYNC or closeout. Use scripts/export-review-packet.ps1 when explicitly requested or when evidence must be transferred to a recipient without access. Existing exporter Stage labels do not add approval gates.
6. When exporting, independently verify ActualChangedPaths is a subset of the approved allowlist, then pass that actual subset as CLI -TaskAllowlist and all task untracked files as -NewFiles. Preserve path protections and exclude unrelated work/secrets. No edits to unused allowlisted files solely for export.
7. Fix concrete blockers within scope, then review only affected changes/dependencies. Optional refactors do not reopen acceptance. Escalate real owner decisions or blockers, not routine debugging. Canon/art/live-data/frozen-spec controls remain binding.
