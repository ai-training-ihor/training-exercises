---
name: bug-workflow
description: Orchestrate bug investigation and fix delivery for Next.js projects
---

# Bug Workflow Task (Next.js Variant)

Structured workflow for bug investigation and resolution in Next.js projects, routing fix generation to specialized agents.

## Operations

### `investigate`

Full bug investigation workflow.

**Inputs:**
- `description`: Bug description
- `linearIssue`: Task management issue ID (optional)
- `affectedFiles`: Known affected files (optional)
- `reproSteps`: Reproduction steps (optional)

**Steps:**
1. **Triage Phase:**
   - Categorize severity: Critical / High / Medium / Low
   - Assess impact: Users affected, systems impacted
   - Identify if Next.js-specific (hydration, SSR, caching, routing)
   - Check for workarounds
   - If issue provided, fetch full details via `mcp-sync`

2. **Investigation Phase:**
   - Invoke `context-loader.loadForBug` to gather context
   - Analyze suspected code paths
   - Check for common Next.js issues:
     - Hydration mismatches (server/client rendering differences)
     - Stale cache (ISR, fetch cache, router cache)
     - Server/client component boundary violations
     - Middleware execution order
     - Dynamic route conflicts
   - Review recent changes to affected files (git blame/log)
   - Search for similar patterns in codebase
   - Document minimal reproduction steps

3. **Root Cause Analysis:**
   - Trace issue to source
   - Classify issue type:
     - Hydration mismatch
     - Server/client boundary error
     - Route handler failure
     - Caching issue
     - Middleware conflict
     - Logic error
     - Race condition
     - Integration failure
   - Assess if architectural problem
   - Document unhandled edge cases

4. **Approval Checkpoint:**
   - Present findings summary
   - Proposed fix approach
   - Risk assessment
   - Wait for user confirmation

5. **Fix Phase (after approval):**
   - Route to appropriate specialist agent based on root cause:
     - Component/UI bugs → `react-component-writer`
     - API route bugs → `api-route-designer`
     - Framework/SSR/caching bugs → `nextjs-specialist`
   - Generate fix code
   - Include defensive improvements

6. **Verification Phase:**
   - Outline test cases for the fix
   - Check for regression risks
   - Verify edge cases covered

7. **Delivery Phase:**
   - Update task management issue via `mcp-sync`
   - Update session state
   - Generate fix summary

**Outputs:**
```json
{
  "bug": {
    "description": "Server component renders as client",
    "severity": "High",
    "linearIssue": "PROJ-211"
  },
  "investigation": {
    "rootCause": "useState in server component forces client rendering",
    "issueType": "server_client_boundary",
    "affectedFiles": [...],
    "reproSteps": [...]
  },
  "fix": {
    "approach": "Extract client state to child component, keep parent as server component",
    "filesModified": [...],
    "linesChanged": 45,
    "agent": "react-component-writer"
  },
  "verification": {
    "testCases": [...],
    "regressionRisk": "Low"
  },
  "status": "fixed|investigating|blocked"
}
```

### `triage`

Quick triage without full investigation.

**Inputs:**
- `description`: Bug description
- `linearIssue`: Issue ID (optional)

**Steps:**
1. Categorize severity
2. Assess impact
3. Identify if Next.js-specific issue
4. Recommend priority
5. Return triage summary

**Outputs:**
```json
{
  "severity": "High",
  "impact": "Affects all users of feature",
  "isNextJsSpecific": true,
  "issueCategory": "hydration_mismatch",
  "recommendedPriority": "P1",
  "suggestedAssignee": "self",
  "workaround": "Add 'use client' directive temporarily"
}
```

### `analyzeOnly`

Root cause analysis without fix generation.

**Inputs:**
- `description`: Bug description
- `affectedFiles`: Files to analyze

**Steps:**
1. Run investigation phase
2. Run root cause analysis
3. Return analysis without fix

**Outputs:**
```json
{
  "rootCause": "...",
  "issueType": "...",
  "suggestedFix": "...",
  "recommendedAgent": "nextjs-specialist|react-component-writer|api-route-designer",
  "estimatedComplexity": "Low|Medium|High"
}
```

## Severity Classification

| Severity | Criteria | Response |
|----------|----------|----------|
| Critical | Production down, data loss, security breach | Immediate fix |
| High | Major feature broken, significant user impact | Same day |
| Medium | Feature degraded, workaround exists | This sprint |
| Low | Minor issue, cosmetic, edge case | Backlog |

## Issue Type Classification (Next.js Specific)

| Type | Description | Typical Agent |
|------|-------------|---------------|
| `hydration_mismatch` | Server/client rendering difference | `react-component-writer` |
| `server_client_boundary` | Wrong component type or boundary violation | `nextjs-specialist` |
| `route_handler_failure` | API route error | `api-route-designer` |
| `caching_issue` | Stale data from ISR/fetch/router cache | `nextjs-specialist` |
| `middleware_conflict` | Middleware execution issues | `nextjs-specialist` |
| `logic_error` | Incorrect business logic | `react-component-writer` or `api-route-designer` |
| `race_condition` | Timing/concurrency issue | `nextjs-specialist` |
| `integration_failure` | External service issue | `api-route-designer` |

## Workflow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Triage    │────▶│ Investigate │────▶│  Root Cause │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                    ┌─────────────────────────┘
                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Approval   │────▶│  Fix via    │────▶│   Verify    │
│ Checkpoint  │     │  Specialist │     │  & Deliver  │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Agent Routing

| Root Cause Area | Agent | Purpose |
|----------------|-------|---------|
| React components, hydration, UI | `react-component-writer` | Component fixes |
| API routes, data fetching | `api-route-designer` | Route handler fixes |
| SSR, caching, middleware, routing | `nextjs-specialist` | Framework-level fixes |
| Database/schema | `schema-designer` | Schema fixes |
| Test cases | `test-planner` | Test generation |

**This variant does NOT use the base `code-writer` agent.** All fix work is routed to specialized agents above.

## Dependencies

- **context-loader**: For bug context
- **mcp-sync**: For task management updates
- **session-management**: For state updates

## Agents Used

- **react-component-writer**: UI and component fixes
- **api-route-designer**: API route fixes
- **nextjs-specialist**: Framework-level fixes

## Approval Checkpoints

Workflow pauses for approval:
1. After root cause analysis (before fix)
2. Before applying fix to critical files

## Error Handling

| Error | Action |
|-------|--------|
| Cannot reproduce | Document attempts, request more info |
| Root cause unclear | Present multiple hypotheses |
| Fix introduces regression | Rollback, revise approach |
| Blocked by external | Mark as blocked, document dependency |

## Git Integration

Bug fixes follow this branch convention:
- Branch: `fix/{issue-id}-{short-description}`
- Commit: `fix({scope}): {description}`
- PR title: `Fix: {description} (#{issue-id})`
