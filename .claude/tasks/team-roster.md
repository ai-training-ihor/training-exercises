---
name: team-roster
description: Load, resolve, and derive team composition from knowledge/team/team-roster.md
---

# Team Roster Task

Single access point for team data. Planning commands and tasks must go
through these operations rather than parsing the roster ad hoc, so
estimation behavior stays consistent.

## Roster Location

`/knowledge/team/team-roster.md` in the target project. If the file is
missing, every operation returns a clear error instructing the user to
create it from the template (`/SetupWorkflow` step "Configure Team
Roster") rather than guessing.

## Operations

### `load`

Parse the roster and return defaults plus all members.

**Steps:**
1. Read `/knowledge/team/team-roster.md`
2. Parse YAML frontmatter: `defaults`, `roleAbbreviations`, `setupDefaults`,
   `estimation`, `team`, `updated`
3. For each member section: parse the yaml block (name, role, seniority,
   velocityFactor, allocation, optional hoursPerDay, skills) and capture
   the prose description verbatim
4. Validate: every `role` maps to a `roleAbbreviations` value; every
   skills key is one of backend, frontend, database, infrastructure,
   testing; velocityFactor is a positive number
5. Return members, defaults, and any validation warnings

**Outputs:** list of member objects `{name, role, seniority,
velocityFactor, allocation, hoursPerDay, skills, description}` plus
`defaults` and `warnings`.

### `resolve`

Resolve a comma-separated list of names against the roster.

**Steps:**
1. Invoke `load`
2. Match each requested name case-insensitively against member names
3. For unknown names, create a placeholder member with role `unknown`,
   seniority `mid`, velocityFactor `1.0`, allocation `100`, empty
   skills, and add a warning: "`{name}` is not in team-roster.md;
   treated as baseline mid-level. Add them to the roster for accurate
   planning."
4. Return matched members and warnings

### `deriveComposition`

Produce a role-count string (for feasibility) from the roster.

**Steps:**
1. Invoke `load`
2. Count members per role, weighting by allocation (a member at 50%
   allocation counts as 0.5)
3. Map roles back to abbreviations and format, e.g. `"1 BE, 1 FE, 1 FS"`
   (round to halves; note fractional people in a parenthetical)
4. Return the composition string and the member list backing it

## Estimation Math (authoritative)

All consumers apply estimates the same way. Every tunable number comes
from the roster frontmatter — nothing is hard-coded in commands or
agents. The values named below are the shipped template values; teams
adjust them in their own roster.

1. Work item size estimates from `/Breakdown` are calibrated to the
   1.0 baseline: a solid mid-level engineer working in their primary area.
2. Per-assignee estimate = baseline estimate x assignee `velocityFactor`.
3. Out-of-area adjustment: if the item's area is not covered by the
   assignee's primary role, look up their proficiency for that area and
   apply the roster's `estimation.proficiencyMultipliers`. Template
   values: 4-5 no adjustment, 3 multiply by 1.25, 2 multiply by 1.5,
   1 or missing `do-not-assign` (flag for reassignment or pairing).
4. Capacity per person = working days x hoursPerDay x (allocation/100)
   x (capacityPercent/100). Use per-person overrides when present,
   otherwise roster `defaults`.
5. Always state applied multipliers in output so plans are auditable,
   e.g. `6-9h (4-6h baseline x 1.5 velocity)`.

If a frontmatter key is missing from an older roster, warn and fall
back to the shipped template values above.

## Error Handling

| Error Type | Action |
|------------|--------|
| Roster file missing | Error: "No team roster found at knowledge/team/team-roster.md. Run /SetupWorkflow or copy the template from base/templates/knowledge/team/." Do not fabricate a team. |
| Member yaml block malformed | Warn, skip member, list what could not be parsed |
| Unknown role or skill area | Warn and continue; treat unknown areas as proficiency unknown (rule 3, last row) |
| Empty roster (no members) | Error with instruction to add at least one member |

## Dependencies

None. Other tasks depend on this one:
- **cycle-planning**: consumes `load`/`resolve` for capacity and assignment
- **technical-feasibility**: consumes `deriveComposition`
- **work-breakdown**: consumes `load` when `suggestAssignees` is enabled
