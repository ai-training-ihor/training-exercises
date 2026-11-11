---
description: Close engineering session with handoff notes and cleanup
---

# EndSession

Close the current engineering session with documentation updates and cleanup.

## Arguments

- `message`: Optional session summary message
- `skipSync`: Skip task management synchronization (default: false)
- `codeReview`: Trigger GitHub Actions code review workflow (default: false)
- `securityReview`: Trigger GitHub Actions security review workflow (default: false)
- `cycleUpdate`: Include Cycle status update (default: true if in active Cycle)

**Shorthand:** You can also use natural language like "with code review" or "run security review" in the command arguments.

## Execution

### Step 1: Gather session context (single parallel batch)

Make ALL of these calls simultaneously in one tool-call round:

1. **Read** `/docs/planning/session-state.json` — current session state
2. **Run** `git log --oneline -10` — recent commits
3. **Run** `git status` — working tree state
4. **Run** `git diff --stat HEAD~5..HEAD` — files changed in recent commits

### Step 2: Update Linear project (if not skipSync)

Update Linear issues and project status for work done during this session.

**2a. Update individual issues:**
- For each issue worked on: update state (In Progress → Done if completed) via `mcp__linear__save_issue`
- Add a comment to any in-progress issue noting what was accomplished

**2b. Post project update (if any issues were completed):**
- Create a Linear project update document via `mcp__linear__create_document` with:
  - Project: configured project from CLAUDE.md
  - Title: `Project Update — YYYY-MM-DD: {brief summary}`
  - Content: Status, completed items, what's next, blockers
- If an **epic** was fully completed (all sub-tasks done), also update its parent issue state to Done

**2c. Update project status (if significant progress):**
- Use `mcp__linear__save_project` to update project description/status if cycle milestones changed

**2d. Cycle update (if in active Cycle and cycleUpdate enabled):**
- Invoke `cycle-monitoring.updateProgress`
- Records session work against cycle metrics
- Updates cycle progress percentage
- Flags any new blockers against cycle scope

If `codeReview` or `securityReview` is enabled:
- Invoke `ci-integration` task with action: `triggerReview`
- Triggers the appropriate GitHub Actions workflow(s)
- Reports workflow run URL(s)

### Step 3: Display session summary

```
## Session Ended

**Date:** YYYY-MM-DD | **Duration:** {startedAt to now}

### Work Completed
- {List of commits made during session}
- {Issues progressed or completed}

### Carried Over
- {Incomplete tasks moving to next session}

### Handoff Notes
{message if provided, or auto-generated summary of what's next}

### Working Tree
{Clean or summary of uncommitted changes}
```

### Step 4: Write output files

1. **Write** `/docs/planning/session-summary-YYYY-MM-DD.md` — the displayed summary above
2. **Update** `/docs/planning/CURRENT-STATE.md` — refresh with current project status
3. **Update** `/docs/planning/session-state.json` — persist the full handoff so the next session resumes without re-deriving context:
   - Set `session.status: "ended"` and `session.endedAt` timestamp
   - `work.completed`: append tasks finished this session, each with its `issueId` (Linear/Jira key)
   - `work.inProgress`: the active/incomplete tasks that carry over (each with `issueId`)
   - `work.blocked`: tasks blocked, each with `issueId` and a `reason`
   - `work.currentTask`: set to the recommended next task to resume (a forward pointer for the next session); set to `null` only if nothing is queued — do not blindly clear it
   - `blockers`: append open blockers (with `issueId` where applicable); mark any resolved this session with `resolvedAt`
   - `decisions`: append decisions made this session (`description`, `rationale`, `relatedTask`)
   - `notes`: append the handoff notes/comments to carry forward (same content as the session-summary file, in machine-readable form)
   - `git.lastCommit` and `git.commitsThisSession` from the Step 1 git context

### Step 5: Clean up session plan

**Delete** `/docs/planning/session-plan-*.md` files from the current session. These are temporary working files created by `/StartSession` and are superseded by the session summary.

## What NOT to Do

- **Do NOT spawn subagents or invoke task definitions** — use direct tool calls only
- **Do NOT verify MCP connections** — if sync fails, report the error and continue
- **Do NOT read CLAUDE.md** — it is already loaded in your system context
- **Do NOT run `gh auth status`** — unnecessary verification

## Output Files

- `/docs/planning/session-summary-YYYY-MM-DD.md` (created)
- `/docs/planning/session-state.json` (updated)
- `/docs/planning/CURRENT-STATE.md` (updated)
- `/docs/planning/session-plan-*.md` (deleted — cleanup)

## Error Handling

- If task management sync fails: report the error, continue with local-only cleanup
- If session-state.json is missing: create a minimal ended state from git context
- If no commits were made: note "No commits this session" in the summary

## Example

```bash
/EndSession message="Completed certificate feature, ready for testing"
```

## Related

- `/StartSession` - Initialize a session
- `/SessionStatus` - Check session state
- `/SyncLinear` - Sync with task management manually

## Tasks Invoked

- `session-management.end`
- `mcp-sync.syncLinear`
- `mcp-sync.syncDocumentation`
- `git-workflow.getState`
- `documentation-sync.updateCurrentState`
- `ci-integration.triggerReview` (if reviews enabled)
- `cycle-monitoring.updateProgress` (if in active cycle)
