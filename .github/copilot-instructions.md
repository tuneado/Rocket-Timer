# Rocket-Timer — Windows Copilot Workflow Rules

These prompts are the standard workflow for debugging and fixing Windows-only
issues in this Electron project. Use them in order, and follow the constraints
described in each step.

General rules for Copilot in this workspace:

- Assume the user is on Windows and working on a branch named
  `fix/windows-<issue>`.
- Prefer minimal, surgical changes. Do not refactor unrelated code.
- Preserve existing behavior on macOS and Linux.
- Add logs only where needed, and keep them concise and easy to remove.
- Update tests only when appropriate for the fix.
- Validation commands to reference: `npm run lint`, `npm run test:unit`,
  `npm run test:e2e`.
- Likely Windows hotspots in this codebase: IPC handlers, `BrowserWindow`
  creation/lifecycle, local API server startup/ports, path resolution and
  filesystem writes, line endings, process spawning, permissions.

---

## 1. Default start prompt (use first every time)

I am on Windows, working on branch `fix/windows-<issue>`.
Help me debug and fix this issue end-to-end with minimal changes and clear
validation steps.

## 2. Reproduce and inspect a Windows-only bug

I am validating a Windows-only bug on branch `fix/windows-<issue>`.
Please help me:

- Identify likely Windows-specific causes in this codebase (paths, permissions,
  line endings, process spawning, ports, Electron window behavior).
- Suggest exactly where to add temporary logs.
- Give me a minimal reproduction checklist I can run now on Windows.

## 3. Create a focused fix plan before editing

Before changing code, propose a fix plan for this issue: `<describe bug>`.
Include:

- Root-cause hypotheses
- Files to inspect first
- Smallest safe code change
- Tests to run on Windows after patching

## 4. Implement fix with minimal risk

Apply the smallest safe code change to fix this bug: `<describe bug>`.
Constraints:

- Avoid refactoring unrelated code
- Preserve existing behavior on macOS/Linux
- Add concise logs only where needed
- Update tests only if appropriate

## 5. Validate after fix

Now validate this fix for Windows.
Give me a step-by-step verification checklist including:

- `npm run lint`
- `npm run test:unit`
- `npm run test:e2e`
- Manual app checks for this bug scenario
- API smoke checks I should run

## 6. Prepare clean commit and PR text

Generate:

- A conventional commit message for this fix
- A PR description with sections:
  - Problem
  - Root cause
  - Fix
  - Windows validation steps
  - Evidence checklist

## 7. If still not fixed

The issue still reproduces on Windows after this patch.
Based on current code and likely runtime behavior, give me the top 3 next
debugging experiments, in order, with exact log points and expected outcomes.

---

## Short Electron-Tailored Prompt Pack

### A. Targeted triage

I am debugging a Windows-only Electron issue.
Prioritize likely hotspots in this order:

1. IPC request/response flow and payload shape
2. `BrowserWindow` creation/options/lifecycle events
3. Local API server startup timing, port conflicts, and retry behavior
4. Path resolution and file system writes on Windows

Return the top 5 hypotheses with confidence and first checks.

### B. Surgical instrumentation

Propose a temporary logging plan with exact insertion points and expected
signal for each point. Keep logs concise and removable. Focus on:

- Main process startup
- IPC handlers
- Window `ready`/`show`/`focus`/`close`
- API server boot and health checks
- Failing user action path

### C. Minimal patch execution

Implement the smallest safe fix for hypothesis #1.

- Do not refactor.
- Do not change behavior outside the bug path.
- Then list exactly what changed and why it is low risk on macOS/Linux.
