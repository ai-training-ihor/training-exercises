---
name: RefactorCode
description: Plan and execute code refactoring in Next.js projects using specialist agents
---

# RefactorCode

Structured code refactoring with Next.js-aware planning, safety checks, and verification.

## Purpose

Guides refactoring efforts using Next.js specialist agents, ensuring framework best practices and no regressions.

## Arguments

- `target`: File, module, or pattern to refactor (required)
- `goal`: Refactoring goal (optional)
  - `simplify` - Reduce complexity
  - `extract` - Extract reusable components
  - `consolidate` - Merge duplicate code
  - `modernize` - Update to current Next.js patterns
- `linearIssue`: Task management issue ID (optional)

## Execution

1. Invoke `feature-workflow` task with action: `plan` (refactor mode)
   - Analysis: Assess current code structure with Next.js awareness
   - Plan: Generate refactoring plan
   - Approval: Present plan for confirmation
   - Implementation: Execute refactoring via specialist agents
   - Verification: Ensure no regressions

2. Display:
   - Current code analysis
   - Refactoring plan
   - Risk assessment
   - Implementation steps

## Prerequisites

- Target code exists
- Understanding of current functionality

## Example

```
/RefactorCode target="src/app/" goal="modernize" linearIssue="PROJ-220"
```

## Refactoring Types

| Goal | Description | Risk Level |
|------|-------------|------------|
| `simplify` | Reduce complexity, improve readability | Low |
| `extract` | Extract shared logic to utilities/components | Medium |
| `consolidate` | Merge duplicate implementations | Medium |
| `modernize` | Update to current Next.js/React patterns (App Router, RSC, Server Actions) | High |

## Safety Checks

Before refactoring:
- Identify all usages of target code
- Check server/client component boundaries
- Check for test coverage
- Note external dependencies

After refactoring:
- Verify all usages still work
- Run existing tests and Next.js build
- Manual verification of critical paths

## Related

- `/ImplementFeature` - For new features
- `/ReviewCode` - Review the refactoring
- `/GenerateTests` - Add test coverage first

## Tasks Invoked

- `feature-workflow.plan` (refactor mode)
- `context-loader.loadFull`
- `quality-gates.review`

## Agent Routing

| Target Type | Agent | Purpose |
|-------------|-------|---------|
| React components | `react-component-writer` | Component refactoring |
| API routes | `api-route-designer` | Route refactoring |
| App Router patterns, layouts, middleware | `nextjs-specialist` | Framework-level refactoring |
| Database | `schema-designer` | Schema refactoring |

**Prefer the specialists above for refactoring in this variant's domain.** `code-writer`
remains available from the base layer for generic code that none of them covers - route there
only when no specialist fits.

## Approval Checkpoint

The workflow pauses for approval after the refactoring plan is generated, before any code changes.
