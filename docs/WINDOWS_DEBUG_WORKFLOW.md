# Windows Debug Workflow

This guide defines the recommended workflow for developing on one machine and validating/debugging on Windows.

## Goals

- Keep one source of truth (single repository)
- Catch Windows-only regressions early
- Make bug reports reproducible and easy to hand off
- Keep commits and PRs small, traceable, and reviewable

## Repository Strategy

Use a single repository for all platforms.

Do not create a second Windows-specific repository unless the Windows app becomes a completely separate product with different code and release lifecycle.

## Branching Model

- `main`: production-ready
- `develop`: integration branch (if you keep this model)
- `feature/*`: new features
- `fix/windows-*`: Windows-specific bug fixes
- `hotfix/*`: urgent production fixes

Example branch names:

- `fix/windows-installer-path-issue`
- `fix/windows-api-port-binding`
- `feature/more-display-presets`

## Daily Cross-Machine Workflow

1. On primary machine, start a focused branch:

```bash
git checkout develop
git pull origin develop
git checkout -b fix/windows-<short-description>
```

2. Implement a small, testable change locally.
3. Run local validation before pushing:

```bash
npm run lint
npm run test:unit
npm run build
```

4. Commit in small slices:

```bash
git add -A
git commit -m "fix(win): <what changed>"
git push -u origin fix/windows-<short-description>
```

5. On Windows machine, switch to the same branch and validate:

```bash
git fetch origin
git checkout fix/windows-<short-description>
git pull
npm ci
npm run build
npm run test:e2e
npm start
```

6. Reproduce the bug and collect evidence (steps, logs, screenshot/video).
7. If fix is needed quickly on Windows, commit there and push to same branch.
8. Pull latest branch on the primary machine and continue iteration.
9. Open a PR when green on Windows and CI is passing.

## Bug Reproduction Template

Use this format in PR descriptions or issue comments:

- Environment: Windows version, CPU arch, app version, Node version
- Branch/commit: SHA tested
- Reproduction steps:
  1. ...
  2. ...
  3. ...
- Expected result: ...
- Actual result: ...
- Frequency: always/intermittent/once
- Attachments: logs, screenshot, short video

## Logging and Diagnostics

### App logs

The app uses `electron-log`. For Windows, collect log files and attach snippets to PRs/issues.

Recommended practice:

- Add temporary, targeted logs around failing code paths
- Use consistent tags per subsystem (IPC/API/WINDOWS/SETTINGS)
- Remove noisy debug logs before merge unless they are operationally useful

### API sanity checks on Windows

After launching app on Windows:

```bash
curl http://localhost:9999/api/health
curl http://localhost:9999/api/timer/state
```

If curl is not available in your terminal, use PowerShell:

```powershell
Invoke-RestMethod http://localhost:9999/api/health
Invoke-RestMethod http://localhost:9999/api/timer/state
```

## CI Expectations

This repository already validates Windows in CI:

- Build matrix includes `windows-latest`
- E2E smoke tests include Windows

Before merging, verify:

- Lint job passed
- Unit tests passed
- Windows build job passed
- Windows E2E smoke passed

## Git Hygiene Across macOS + Windows

To avoid line-ending noise and permission diffs:

1. Keep `.gitattributes` committed (already present).
2. Use these Git settings per machine.

macOS/Linux:

```bash
git config --global core.autocrlf input
git config --global core.filemode false
```

Windows:

```bash
git config --global core.autocrlf true
git config --global core.filemode false
```

If line endings get mixed accidentally:

```bash
git add --renormalize .
git status
```

## Commit and PR Conventions

Suggested commit prefixes:

- `fix(win): ...`
- `fix(ipc): ...`
- `fix(api): ...`
- `chore(ci): ...`
- `docs(win): ...`

PR checklist:

- Reproduced on Windows
- Added or updated test when practical
- Confirmed no regressions in main flow
- Attached logs/evidence for Windows-only fixes
- CI green on all required jobs

## When to Work Directly on Windows

Work directly on Windows when:

- The bug cannot be reproduced on macOS
- The issue depends on Windows APIs, installer behavior, permissions, or display stack
- You need immediate turnaround on a customer-reported Windows-only bug

Even in that case, commit to the same shared branch and keep one repository.

## Release Readiness for Windows

Before creating/reviewing a release:

1. Verify installer generation (`.exe`/NSIS)
2. Fresh install test on Windows machine
3. Upgrade path test from previous version
4. Basic API smoke (`/api/health`, `/api/timer/state`)
5. External display/window behavior check
6. Validate app launch after reboot

## Short Version (Recommended Default Loop)

1. Code on primary machine
2. Push branch
3. Pull same branch on Windows
4. Reproduce and validate
5. Commit fixes where fastest
6. Push and open PR
7. Merge only after Windows + CI are green
