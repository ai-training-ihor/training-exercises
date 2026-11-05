---
name: FixBug
description: Diagnose and fix bugs in Next.js applications using specialist agents
---

# FixBug

Structured bug investigation and resolution workflow for Next.js projects.

## Purpose

Guides the bug fixing process from triage through fix delivery using Next.js specialist agents for diagnosis and fix generation.

## Arguments

- `description`: Bug description (required)
- `linearIssue`: Task management issue ID (optional)
- `affectedFiles`: Known affected files (optional)
- `severity`: Initial severity assessment (optional: `critical` | `high` | `medium` | `low`)

## Execution

1. Invoke `bug-workflow` task with action: `investigate`
   - Triage: Categorize severity and impact
   - Investigation: Analyze code paths, recent changes
   - Root Cause: Identify source of issue
   - Approval: Present findings before fix
   - Fix: Generate fix via specialist agents (see Agent Routing)
   - Verification: Outline test cases

2. Display:
   - Severity and impact assessment
   - Root cause analysis
   - Fix approach
   - Test verification plan

## Prerequisites

- Bug description or task management issue

## Example

```
/FixBug description="Server component renders as client" linearIssue="PROJ-211" affectedFiles=["src/app/profile/page.tsx"]
```

## Workflow Phases

### 1. Triage
- Categorize: Critical / High / Medium / Low
- Assess impact: Users affected, systems impacted
- Identify if Next.js-specific (SSR, hydration, routing, caching)

### 2. Investigation
- Reproduce the issue
- Check for common Next.js pitfalls (hydration mismatch, stale cache, middleware issues)
- Analyze suspected code paths
- Review recent changes (git blame)

### 3. Root Cause Analysis
- Trace issue to source
- Classify: hydration error, routing issue, server/client boundary, API route failure, caching bug, etc.
- Assess architectural implications

### 4. Approval Checkpoint
**STOP** - Present findings for review before proceeding

### 5. Fix Implementation
- Route to appropriate specialist agent based on root cause
- Include Next.js best practices in fix

### 6. Verification
- Define regression tests
- Outline manual verification steps

## Related

- `/ImplementFeature` - For new features
- `/ReviewCode` - Review the fix
- `/GenerateTests` - Generate test plan

## Tasks Invoked

- `bug-workflow.investigate`
- `context-loader.loadForBug`
- `mcp-sync.syncLinear`

## Agent Routing

| Root Cause Area | Agent | Purpose |
|----------------|-------|---------|
| React components, UI rendering | `react-component-writer` | Component fixes, hydration issues |
| API routes, data fetching | `api-route-designer` | Route handler fixes, middleware |
| App Router, SSR, caching, middleware | `nextjs-specialist` | Framework-level fixes |
| Database/schema | `schema-designer` | Schema fixes |
| Test cases | `test-planner` | Test generation |

**Prefer the specialists above for fix work in this variant's domain.** `code-writer` remains
available from the base layer for generic code that none of them covers - route there only
when no specialist fits.
