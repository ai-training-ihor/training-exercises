---
name: SubmitVariant
description: Submit a variant or variant changes to the community via branch and pull request
user_invocable: true
---

# /SubmitVariant

Submit a new variant or changes to an existing variant to the claude-workflow repository via a proper branching and pull request workflow. This command ensures contributions follow the repository's contribution guidelines.

## Purpose

Contribute your variants and improvements back to the community:
- Submit new variants you've created
- Propose updates to existing variants
- Fix bugs in variant components
- All contributions go through branches and PRs - never direct push to main

## Usage

```
/SubmitVariant <variant-name> [options]
```

## Arguments

- `variant-name`: The variant to submit (required)

## Options

- `--type`: Submission type: `new` | `update` | `fix` (default: auto-detect)
- `--title`: Custom PR title
- `--dry-run`: Preview what would be submitted without actually creating PR

## Submission Process

### 1. Pre-flight Checks

Before submission, the command verifies:
- The project has a `.claude/workflow-manifest.json` naming the variant (or the user supplies the
  variant's identity interactively)
- GitHub CLI is authenticated (`gh auth status`)
- User has push access or can fork

#### Where the variant's files are

A project does **not** contain a `variants/<name>/` folder. It contains the merged flat layout —
`.claude/agents/`, `.claude/commands/`, `.claude/tasks/`, `.github/workflows/` — plus
`.claude/workflow-manifest.json`, which records which layer every file came from.

The repository, by contrast, stores each variant as a self-contained `variants/<name>/` folder,
because that is the unit a pull request reviews and versions. This command bridges the two shapes:
it **materializes** the repo-shaped folder from the manifest, submits it, and **removes it again**.

Collect the variant's files as follows:

1. Read `.claude/workflow-manifest.json`. Every `components.*` entry with `"layer": "variant"` is
   part of the variant.
2. Cross-check against the freshly cloned repo (Step 2), across `.claude/{agents,commands,tasks}`
   **and `.github/workflows/`** — a CI workflow the user added after setup is variant-owned too,
   and the copy table below has a row for it.

   For each file, in this order:
   - The manifest marks it `"layer": "local"` → it is the **user's own file, not part of the
     variant**. Never include it. (`init-project.py` tags anything it did not install this way.)
   - Not present in the clone's `base/` → variant-owned, even if the manifest missed it.
   - Present in `base/` but content differs → a variant **override**; include it.
   - Present in `base/` and identical → base; exclude it.

   Always list what this produced and have the user confirm before anything is committed. The
   `local` check exists specifically so a private file the user keeps in `.claude/` cannot be
   swept into a public pull request.
3. If there is no manifest (pre-1.3.0 or script-based install), fall back entirely to the
   diff-against-base in step 2 and ask the user to confirm the resulting file list.

`.claude/variants/<name>/` is **not** a source location. If a legacy project still has one, run the
plugin's `/claude-workflow:update` first to merge its components into the flat directories; the
folder is left in place and removing it is the user's decision.

### 2. Materialize the Variant Folder (temporary)

**Every shell block below re-derives `WORKDIR` on its own line.** Shell state does not survive
between tool calls, so a variable assigned in an earlier block is empty in a later one — and
`rm -rf ""` silently does nothing while looking like it worked. Use the literal path, or re-assign
it at the top of each block, in every block that references it.

Clone the repository and build the variant folder inside the clone. It exists only for the
lifetime of this command:

```bash
WORKDIR="/tmp/claude-workflow-submit-{name}"
rm -rf "$WORKDIR"
git clone https://github.com/ai-training-ihor/claude-workflow.git "$WORKDIR"
mkdir -p "$WORKDIR/variants/{name}"/agents "$WORKDIR/variants/{name}"/commands \
         "$WORKDIR/variants/{name}"/tasks "$WORKDIR/variants/{name}"/templates \
         "$WORKDIR/variants/{name}"/github-workflows
echo "Materialized at: $WORKDIR/variants/{name}"
```

Copy each variant-owned file from the project into its repo-shaped position:

| Project (flat) | Variant folder |
|---|---|
| `.claude/agents/<f>.md` | `variants/{name}/agents/<f>.md` |
| `.claude/commands/<f>.md` | `variants/{name}/commands/<f>.md` |
| `.claude/tasks/<f>.md` | `variants/{name}/tasks/<f>.md` |
| `.github/workflows/<f>.yml` | `variants/{name}/github-workflows/<f>.yml` |

Then generate the two files that have no home in a project:

- **`manifest.json`** — from the project manifest's `variant` block (`name`, `version`,
  `description`, `projectType`), with a `components` array listing every file just copied, plus
  `baseExclusions` carried over. Prompt the user for anything missing.
  Include `"$schema": "../../base/schema/manifest.schema.json"` to match the four variants already
  in the repository — the path resolves correctly at `variants/<name>/`, which is where this file
  is being written.
- **`README.md`** — generated from the variant's description and component list. Show it to the
  user and let them edit before committing; a generated README is a starting point, not the
  finished article.

Remove any of the scaffold directories that ended up empty, so the PR contains no empty folders.

### 2b. Check What Was Built

Verify by reading, not by running a script. `/SubmitVariant` may be running in a project that was
set up by the plugin, which requires only `git` — assuming a Python interpreter is present would
add a prerequisite the install never had, and `python` in particular does not exist on macOS 12.3+
or on Debian/Ubuntu without `python-is-python3`.

Check each of these against the materialized folder:

- `manifest.json` parses as JSON and has `name`, `version` (`X.Y.Z`), `description`, `projectType`
  (a lowercase slug), and `components`.
- Every path in `components.*` exists in the folder, and every component file present in the folder
  is listed in `components.*`.
- Each component `.md` opens with frontmatter carrying `name:` and `description:`, and `name`
  matches the filename stem. (This is what `scripts/validate-variant.py` enforces; the repository's
  CI runs it on the PR.)
- `README.md` is present and non-empty.

Report anything that fails and let the user fix it before the PR is opened.

If the user is working inside a clone of `claude-workflow` and has Python available, they can also
run `python scripts/validate-variant.py variants/{name}` themselves — but never make the submission
depend on it.

### 3. Create Branch

Creates appropriately named branch:

| Submission Type | Branch Name |
|-----------------|-------------|
| New variant | `variant/{name}` |
| Update | `variant/{name}-update-YYYYMMDD` |
| Bug fix | `variant/{name}-fix-{description}` |

### 4. Stage and Commit

- Stages `variants/{name}/` inside the temporary clone
- Creates descriptive commit message
- Shows diff summary for confirmation

### 5. Push and Create PR

- Pushes branch to origin (or fork)
- Creates pull request via GitHub CLI
- Includes variant summary in PR description
- Adds appropriate labels

### 6. Clean Up the Temporary Folder

**Only after the PR is confirmed open**, delete the working clone — it has served its purpose and
nothing local should depend on it. Re-derive the path in this same block (see the warning in Step
2) and confirm the deletion actually happened:

```bash
WORKDIR="/tmp/claude-workflow-submit-{name}"
if [ -n "$WORKDIR" ] && [ -d "$WORKDIR" ]; then
  rm -rf "$WORKDIR"
  [ -d "$WORKDIR" ] && echo "WARNING: could not remove $WORKDIR" || echo "Removed $WORKDIR"
else
  echo "Nothing to remove at $WORKDIR"
fi
```

Report the PR URL and state plainly that the temporary folder was removed and that the project's
own files were not touched. Nothing in the project changes as a result of submitting.

**Keep the folder** — and tell the user its exact path — in either of these cases:
- The PR could not be created. The work is recoverable from the clone.
- This was a `--dry-run`. No PR is created, so there is nothing to clean up against; say where the
  materialized folder is so the user can inspect it, and remind them to delete it when done.

## Examples

```bash
# Submit a new variant
/SubmitVariant swift-ios

# Submit update to existing variant
/SubmitVariant nextjs-development --type update

# Preview without submitting
/SubmitVariant swift-ios --dry-run

# Custom PR title
/SubmitVariant swift-ios --title "Add Swift iOS variant with SwiftUI support"
```

## Output

```
Submitting variant: swift-ios

Pre-flight checks:
  ✓ Variant validation passed
  ✓ GitHub CLI authenticated
  ✓ Repository access confirmed
  ✓ Working directory clean

Creating branch: variant/swift-ios

Files to be committed (materialized from .claude/workflow-manifest.json):
  + variants/swift-ios/manifest.json          (generated)
  + variants/swift-ios/README.md              (generated)
  + variants/swift-ios/agents/swift-specialist.md   (from .claude/agents/)
  + variants/swift-ios/commands/CreateView.md       (from .claude/commands/)

Commit message:
  feat(variant): Add swift-ios variant for iOS development

  - Swift and SwiftUI specialist agent
  - iOS-specific project structure
  - Xcode integration patterns

  Components: 1 agent, 0 commands, 0 tasks

Push to origin? [Y/n]: y

Creating pull request...

✓ Pull request created: https://github.com/ai-training-ihor/claude-workflow/pull/42

Next steps:
1. Review your PR at the link above
2. Respond to any review feedback
3. Once approved, maintainers will merge to main
```

## Pull Request Template

The generated PR follows this format:

```markdown
## Summary

Add {variant-name} variant for {project-type} development.

## Components

| Type | Count | Details |
|------|-------|---------|
| Agents | 1 | swift-specialist |
| Commands | 0 | - |
| Tasks | 0 | - |
| Templates | 1 | CLAUDE.md.variant |

## Description

{variant-description}

## Checklist

- [x] Variant validation passes
- [x] README.md included
- [x] All components documented
- [ ] Tested with sample project

## Test Instructions

1. Clone this PR branch
2. Run: `/SetupWorkflow /path/to/test --variant {variant-name}`
3. Verify setup completes successfully
```

## Handling Updates to Existing Variants

When submitting changes to variants in the main repository:

1. Ensure you're working with the latest main
2. Make your changes in the variant directory
3. Run `/SubmitVariant variant-name --type update`
4. Branch name includes date to avoid conflicts
5. PR describes what changed

## Fork Workflow

If you don't have push access to the main repository:

1. Command detects lack of push access
2. Offers to fork the repository
3. Creates branch on your fork
4. PR targets the upstream repository

```
You don't have push access to ai-training-ihor/claude-workflow.
Would you like to fork and submit from there? [Y/n]: y

Forking repository...
✓ Fork created: yourusername/claude-workflow

Pushing to fork...
Creating PR to upstream...
```

## Safety Rules

This command enforces safe contribution practices:

1. **Never pushes to main** - Always creates feature branches
2. **Requires validation** - Won't submit invalid variants
3. **Requires clean state** - No uncommitted changes
4. **Descriptive commits** - Auto-generates meaningful commit messages
5. **PR review required** - All changes need maintainer approval

## Error Handling

| Error | Action |
|-------|--------|
| Validation failed | Show errors, abort submission |
| Not authenticated | Prompt to run `gh auth login` |
| Branch exists | Offer to use existing or create new |
| Push rejected | Check permissions, suggest fork |
| PR creation failed | Show error, provide manual instructions |

## Related Commands

- `/CreateVariant` - Create a new variant
- `/SetupWorkflow` - Test variant before submitting
- `/CheckMCPStatus` - Verify GitHub CLI status

## Tasks Invoked

- `variant-management.validate`
- `variant-management.prepareBranch`
- `variant-management.submitPullRequest`

## Prerequisites

- GitHub CLI installed and authenticated (`gh auth login`)
- Git configured with user.name and user.email
- Variant passes validation

## Notes

- First-time contributors may need to fork
- Maintainers review all PRs before merge
- Complex variants may require discussion before submission
- Consider opening an issue first for major new variants
