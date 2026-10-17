---
trigger: always_on
description: "Concise task reporting and mandatory ChatGPT review handoff"
---

# Mandatory Concise Task Reporting & Independent Review Handoff

1. **No Source, Diff, or Log Dumps in Chat**: Never paste full source files, long code diffs, or raw command logs into chat responses. Write all code and documentation modifications directly to their real repository files.
2. **Mandatory Pre-Review Packet Generation**: Before declaring any `PLAN`, `BUILD`, `REVIEW`, `VERIFY`, `DOC_SYNC`, or `CLOSEOUT` task ready for independent review or owner approval, generate a deterministic review packet outside the Git working tree using `scripts/export-review-packet.ps1` (passing `-NewFiles` and `-TaskAllowlist` so zero task-scoped untracked files are omitted, enforcing canonical root and no-reparse-point checks, and noting that path validation does not guarantee arbitrary file contents are free of secrets).
3. **Truthful Verification & Artifact Reporting**: Never claim tests passed, artifacts exist, or commits/pushes succeeded without actual command execution and verification on the final file state. Report skipped or preflight-blocked checks (such as `LIVE_PG_INTEGRATION: NOT_RUN` or port-preflight stops) explicitly.
4. **Strict Owner Approval Gates**: Never stage, commit, push, or start subsequent tasks/slices without explicit project-owner authorization. Stop at Stage 7 (`OWNER APPROVAL`) after completing local verification and review packet export.
5. **Required End-of-Task Response Format**: Keep final chat responses concise and always conclude with:
   - Task status, base/current `HEAD` SHA, and exact modified/untracked repository paths.
   - Exact verification commands run, exit codes, and any blockers or known limitations.
   - Next required owner approval gate.
   - **Files Owner Must Send to ChatGPT**: exact review packet ZIP filename, absolute path under the system temporary directory, SHA-256 hash, exact archived file list, and review purpose.
