---
name: feature-workflow
description: Orchestrate feature implementation for Next.js projects using specialist agents
---

# Feature Workflow Task (Next.js Variant)

End-to-end orchestration for feature implementation in Next.js projects, coordinating requirement discovery, specification generation, and routing to specialized Next.js agents.

## Operations

### `implement`

Full feature implementation workflow.

**Inputs:**
- `feature`: Feature name or description
- `linearIssue`: Optional task management issue ID
- `stack`: Technology requirements (e.g., `["database", "api", "ui"]`)
- `skipSpec`: Skip spec generation if already exists (default: false)

**Steps:**
1. **Discovery Phase:**
   - Invoke `requirement-discovery.discover(query: feature)`
   - Invoke `context-loader.loadForFeature(featureName: feature)`
   - If issue provided, fetch full details

2. **Specification Phase (unless skipSpec):**
   - Check for existing spec in `/docs/specs/`
   - If missing, generate feature specification:
     - Architecture alignment (App Router, server/client split)
     - File structure plan (following Next.js conventions)
     - API design (Route Handlers, Server Actions)
     - Database changes (if applicable)
   - Write spec to `/docs/specs/{feature-name}.md`

3. **Approval Checkpoint:**
   - Present specification summary
   - List files to create/modify
   - Wait for user confirmation
   - If rejected, return to specification phase

4. **Implementation Phase:**
   - If `database` in stack:
     - Route to `schema-designer` agent for schema design
     - Generate migration (if approved)
   - If `api` in stack:
     - Route to `api-route-designer` agent with:
       - API spec, route conventions, validation requirements
   - If `ui` in stack:
     - Route to `react-component-writer` agent with:
       - Component spec, design system, accessibility requirements
   - For architecture decisions (layouts, middleware, data fetching strategy):
     - Route to `nextjs-specialist` agent
   - Collect generated code

5. **Integration Phase:**
   - Verify code aligns with spec
   - Check server/client component boundaries
   - Verify proper use of App Router conventions
   - Check for missing implementations

6. **Update Phase:**
   - Update task management issue with progress via `mcp-sync`
   - Update session state with completed work
   - Generate implementation summary

**Outputs:**
```json
{
  "feature": "User Profile Page",
  "status": "completed|partial|blocked",
  "specification": {
    "path": "/docs/specs/user-profile.md",
    "generated": true
  },
  "implementation": {
    "filesCreated": [...],
    "filesModified": [...],
    "linesOfCode": 250
  },
  "linearUpdates": {
    "issueId": "PROJ-211",
    "newState": "In Review"
  },
  "nextSteps": [...]
}
```

### `plan`

Generate implementation plan without executing.

**Inputs:**
- `feature`: Feature name or description
- `linearIssue`: Optional issue ID

**Steps:**
1. Run discovery phase only
2. Generate specification
3. Create implementation plan with Next.js-specific agent routing
4. Return plan without executing

**Outputs:**
```json
{
  "feature": "User Profile Page",
  "plan": {
    "phases": [
      {
        "name": "Database",
        "tasks": [...],
        "agent": "schema-designer"
      },
      {
        "name": "API Routes",
        "tasks": [...],
        "agent": "api-route-designer"
      },
      {
        "name": "UI Components",
        "tasks": [...],
        "agent": "react-component-writer"
      },
      {
        "name": "Architecture",
        "tasks": [...],
        "agent": "nextjs-specialist"
      }
    ],
    "estimatedFiles": 8,
    "dependencies": [...]
  }
}
```

### `resume`

Resume a partially completed feature.

**Inputs:**
- `feature`: Feature name
- `fromPhase`: Phase to resume from

**Steps:**
1. Load existing spec from `/docs/specs/`
2. Check session state for progress
3. Identify remaining work
4. Continue from specified phase

**Outputs:**
Same as `implement`

## Workflow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Discovery  │────▶│   Spec Gen  │────▶│  Approval   │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                    ┌─────────────────────────┘
                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Database   │────▶│ API Routes  │────▶│     UI      │
│schema-design│     │api-route-des│     │react-comp-wr│
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                    ┌─────────────────────────┘
                    ▼
┌─────────────┐     ┌─────────────┐
│ Architecture│────▶│   Update    │
│nextjs-spec  │     │   Tracking  │
└─────────────┘     └─────────────┘
```

## Agent Routing

| Requirement Type | Agent | Input |
|------------------|-------|-------|
| Database schema | `schema-designer` | Requirements, existing schema |
| API endpoints / Route Handlers | `api-route-designer` | Spec, route conventions, validation |
| React components / Pages / Layouts | `react-component-writer` | Spec, design system, accessibility |
| App Router patterns / SSR / Caching | `nextjs-specialist` | Architecture requirements |
| Tests | `test-planner` | Implementation, acceptance criteria |

**This variant does NOT use the base `code-writer` agent.** All implementation work is routed to the specialized agents above.

## Specification Template

Generated specs follow this structure:

```markdown
# Feature: {name}

## Overview
{description}

## Requirements
{from requirement-discovery}

## Architecture
### Server vs Client Components
- Server components: {list}
- Client components: {list}

### Files to Create
- src/app/{route}/page.tsx - Page component
- src/components/{name}.tsx - Reusable component
- src/app/api/{route}/route.ts - API handler

### Files to Modify
- existing/file.ts - changes needed

## Database Changes
{if applicable}

## API Design
### Route Handlers
{endpoint definitions}

### Server Actions
{if applicable}

## UI Components
{component hierarchy}

## Testing Strategy
{outline}

## Acceptance Criteria
{from requirements}
```

## Dependencies

- **requirement-discovery**: For requirements
- **context-loader**: For project context
- **mcp-sync**: For task management updates
- **session-management**: For state updates

## Agents Used

- **schema-designer**: Database design
- **api-route-designer**: API routes and data fetching
- **react-component-writer**: React components and UI
- **nextjs-specialist**: Architecture and framework patterns

## Error Handling

| Error | Action |
|-------|--------|
| Requirements not found | Prompt for manual input |
| Spec generation fails | Save partial, flag for review |
| Agent produces invalid code | Flag errors, request fixes |
| Task management update fails | Continue, retry at end |

## Approval Checkpoints

The workflow pauses for user approval at:
1. After specification generation
2. Before database migrations
3. Before major file creation

Approvals prevent unintended changes and ensure alignment.
