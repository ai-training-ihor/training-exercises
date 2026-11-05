---
description: Convert a validated PRD into sized, prioritized Work Items with dependency mapping
---

# Breakdown

Convert a PRD into actionable Work Items with size estimates, priorities, and dependency relationships.

## Purpose

Takes an enriched, validated PRD and generates a complete work breakdown structure with sized tickets, dependency graphs, and optional automatic creation in Linear.

Size estimates are calibrated to the roster's 1.0 baseline; per-person adjustment happens at assignment time (here with `suggestAssignees`, or in `/CyclePlan`).

## Arguments

- `prd`: PRD identifier (required)
- `targetSize`: Target ticket size (optional)
  - `2-4h` - Small tasks
  - `4-8h` - Medium tasks (default)
  - `1-2d` - Large tasks
- `includeTests`: Include test tickets (default: true)
- `dryRun`: Preview without creating tickets (default: false)
- `suggestAssignees`: Suggest a best-fit assignee per Work Item from the roster skills matrix (default: false)

## Execution

1. Load enriched, validated PRD
   - Resolve PRD by identifier from `/docs/planning/prds/`
   - Validate PRD has passed enrichment and validation steps

2. Invoke `work-breakdown` task with action: `generate`
   - Decompose requirements into Work Items at target size
   - Assign area labels (Backend, Frontend, Infrastructure, etc.)
   - Estimate size ranges for each item
   - Set priority based on dependency order and business value

3. Generate Work Items from requirements
   - Map each requirement to one or more Work Items
   - Each Work Item description MUST follow the **Linear Issue Description Standard** (CLAUDE.md): `## Overview`, `## Deliverables`, `## Definition of Done`
   - Include acceptance criteria from PRD as Definition of Done checkboxes
   - Always include testing criteria in Definition of Done
   - Add test tickets if `includeTests` is enabled

4. Create dependency relationships
   - Identify blocking/blocked-by relationships
   - Generate dependency graph
   - Validate no circular dependencies

5. If `suggestAssignees` is true, invoke `team-roster` task with action: `load`
   - Match each item's area to member proficiencies
   - Pick the best fit considering load balance across members
   - Compute the adjusted estimate per the `team-roster` task's Estimation Math

6. If not `dryRun`, invoke `mcp-sync` task with action: `createWorkItems`
   - Create issues in Linear
   - Set dependencies between issues
   - Apply labels and priorities

## Prerequisites

- PRD exists and has been validated
- Linear MCP configured (if not dryRun)

## Output Format

```
### Work Breakdown: {prd}
**Items:** 14 | **Test Tickets:** 6 | **Target Size:** 4-8h

#### Backend (5 items)
| ID | Title | Size | Priority |
|----|-------|------|----------|
| WI-001 | Set up database schema | 4-6h | P1 |
| WI-002 | Implement API endpoints | 6-8h | P1 |
| WI-003 | Add validation layer | 4-6h | P2 |

#### Frontend (4 items)
| ID | Title | Size | Priority |
|----|-------|------|----------|
| WI-006 | Create form components | 4-8h | P2 |
| WI-007 | Implement state management | 4-6h | P2 |

#### Dependency Graph
WI-001 ──> WI-002 ──> WI-003
                  └──> WI-006 ──> WI-007

**Total Estimate:** 68-102h (8.5-12.75 days)
```

With `suggestAssignees=true`, the item tables gain `Suggested` and `Adjusted Est.` columns, e.g. `| WI-001 | Set up database schema | 4-6h | P1 | Alice | 3.2-4.8h (x0.8 velocity) |`.

## Output Files

- `/docs/planning/prds/{prd}-breakdown.md`

## Example

```
/Breakdown prd="user-profile-v2" targetSize="4-8h" includeTests=true dryRun=true
```

## Related

- `/CyclePlan` - Plan a cycle using breakdown output
- `/ImplementFeature` - Implement individual Work Items
- `/SyncLinear` - Manual Linear operations

## Tasks Invoked

- `work-breakdown.generate`
- `team-roster.load` (when `suggestAssignees` is true)
- `mcp-sync.createWorkItems`

## Agents Used

- `cycle-planner`
