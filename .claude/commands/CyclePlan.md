---
description: Plan a capacity-aware Cycle with scope recommendations and risk assessment
---

# CyclePlan

Plan a capacity-aware development Cycle with scope recommendations, milestones, and risk assessment.

## Purpose

Generates a draft Cycle plan by loading team capacity and prioritized backlog, then recommending scope that fits within available capacity while identifying milestones and risks.

## Arguments

- `duration`: Cycle duration (required)
  - `1w` - One week
  - `2w` - Two weeks
  - `3w` - Three weeks
- `team`: Team members, comma-separated (optional). Omitted: plans for every member in `knowledge/team/team-roster.md`. Provided: each name is resolved against the roster; unknown names are planned at baseline with an explicit warning.
- `capacity`: Capacity percentage (optional). Omitted: uses `defaults.capacityPercent` from the roster.
- `goal`: Cycle goal statement (required)

## Execution

1. Load team capacity
   - Invoke `team-roster` task: `load` when `team` is omitted, `resolve` when provided
   - Compute per-member available hours from roster `hoursPerDay`, `allocation`, `workingDaysPerWeek`, the cycle duration, and the capacity percentage (per-member overrides win over roster `defaults`)
   - Surface any roster warnings (unknown names, malformed members) in the output

2. Load prioritized backlog from Linear
   - Invoke `mcp-sync` task with action: `getBacklog`
   - Fetch Work Items sorted by priority
   - Include size estimates and dependencies

3. Invoke `cycle-planning` task with action: `plan`
   - Match backlog items to available capacity
   - Respect dependency ordering
   - Balance work across team members
   - Pass full member objects (role, velocityFactor, skills) so assignment respects the skills matrix and estimates are adjusted per the `team-roster` task's Estimation Math section

4. Recommend scope based on capacity
   - Flag items that fit within capacity
   - Identify stretch goals
   - Highlight items deferred to next cycle

5. Identify milestones
   - Group Work Items into logical milestones
   - Set milestone target dates within the cycle

6. Generate risk assessment
   - Identify capacity risks (overallocation, single points of failure)
   - Flag dependency risks (external blockers, long chains)
   - Note estimation uncertainty

7. Save draft Cycle plan
   - Write plan document for review before committing

## Prerequisites

- Work Items exist in Linear backlog (from `/Breakdown`)
- `knowledge/team/team-roster.md` exists (created by `/SetupWorkflow`, or copy the template from `base/templates/knowledge/team/`)
- Linear MCP configured and authenticated

## Output Format

```
### Cycle Plan: {goal}
**Duration:** 2w (Jan 20 - Feb 2) | **Capacity:** 80%

#### Team Capacity
| Member | Available | Allocated | Remaining |
|--------|-----------|-----------|-----------|
| Alice  | 48h       | 42h       | 6h        |
| Bob    | 38.4h     | 34h       | 4.4h      |
| Carol  | 48h       | 40h       | 8h        |

Available = working days x hoursPerDay x allocation x capacity (Bob is at 80% allocation).
Estimates adjusted per member: Alice x0.8 (senior BE), Bob x1.0, Carol x1.5 (junior)

#### Roster Warnings
- `Dave` is not in team-roster.md; treated as baseline mid-level. Add them to the roster for accurate planning.

#### Recommended Scope (12 items)
| ID | Title | Assignee | Size | Priority |
|----|-------|----------|------|----------|
| WI-001 | Database schema | Alice | 4-6h | P1 |
| WI-002 | API endpoints | Bob | 6-8h | P1 |

#### Milestones
1. **API Complete** - Jan 27 (WI-001, WI-002, WI-003)
2. **UI Complete** - Jan 31 (WI-006, WI-007)

#### Risk Register
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Auth service dependency | High | Medium | Early spike |
```

## Output Files

- `/docs/planning/cycles/cycle-YYYY-MM-DD.md`

## Example

Roster-driven (plans for every member in `knowledge/team/team-roster.md`):

```
/CyclePlan duration="2w" goal="Complete user profile feature"
```

Explicit subset (names resolved against the roster):

```
/CyclePlan duration="2w" team="Alice,Bob" capacity="70%" goal="Complete user profile feature"
```

## Related

- `/Breakdown` - Generate Work Items for planning
- `/CycleCommit` - Commit this plan to Linear
- `/CycleStatus` - Monitor cycle progress

## Tasks Invoked

- `team-roster.load` (when `team` omitted) / `team-roster.resolve` (when provided)
- `cycle-planning.plan`
- `mcp-sync.getBacklog`

## Agents Used

- `cycle-planner`
