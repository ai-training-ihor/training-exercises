---
name: ImplementFeature
description: Implement a feature end-to-end using Next.js specialist agents for code generation
---

# ImplementFeature

Full feature implementation workflow for Next.js projects, routing to specialized agents.

## Purpose

Orchestrates the complete feature implementation process using Next.js-specific agents: discovers requirements, generates specifications, routes work to the appropriate specialist agent, and updates tracking systems.

## Arguments

- `feature`: Feature name or description (required)
- `linearIssue`: Task management issue ID (optional, for linking)
- `stack`: Technology requirements array (optional)
  - `database` - Requires schema changes
  - `api` - Requires API endpoints
  - `ui` - Requires UI components
- `skipSpec`: Skip specification generation (default: false)

## Execution

1. Invoke `feature-workflow` task with action: `implement`
   - Discovery: Finds requirements from PRDs, documentation, task management
   - Specification: Generates or loads feature spec
   - Approval: Presents plan for confirmation
   - Implementation: Routes to specialist agents (see Agent Routing below)
   - Update: Syncs task management with progress

2. Display:
   - Requirements summary
   - Implementation plan
   - Generated code locations
   - Next steps

## Prerequisites

- Requirements exist in PRD, documentation, or task management
- Session active (recommended)
- Next.js project with App Router

## Output Files

- `/docs/specs/{feature-name}.md` (if generated)
- Code files as specified

## Example

```
/ImplementFeature feature="User profile page" linearIssue="PROJ-211" stack=["database", "api", "ui"]
```

## Related

- `/FixBug` - For bug fixes
- `/RefactorCode` - For refactoring
- `/ReviewCode` - Review implementation
- `/CreateComponent` - Scaffold individual components
- `/CreateAPIRoute` - Scaffold individual API routes

## Tasks Invoked

- `feature-workflow.implement`
- `requirement-discovery.discover`
- `context-loader.loadForFeature`
- `mcp-sync.syncLinear`

## Agent Routing

| Requirement Type | Agent | When to Use |
|------------------|-------|-------------|
| Database schema | `schema-designer` | Schema changes needed |
| API endpoints | `api-route-designer` | Route handlers, middleware, API logic |
| UI components | `react-component-writer` | React components, pages, layouts |
| Architecture decisions | `nextjs-specialist` | App Router patterns, server/client split, data fetching strategy |
| Tests | `test-planner` | Test specifications |

**Prefer the specialists above for implementation in this variant's domain.** `code-writer`
remains available from the base layer for generic code that none of them covers (build
scripts, config, plain utility modules) - route there only when no specialist fits.

## Approval Checkpoints

The workflow pauses for approval:
1. After specification generation
2. Before database migrations
3. Before major file creation
