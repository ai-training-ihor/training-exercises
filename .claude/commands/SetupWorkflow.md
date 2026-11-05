---
name: SetupWorkflow
description: Interactively set up or update the Claude Workflow System in a project
user_invocable: true
---

# /SetupWorkflow

Interactively set up the Claude Workflow System in a new or existing project. This command guides you through configuration options and handles file copying/merging.

## Usage

```
/SetupWorkflow [target-path]
```

## Arguments

- `target-path`: Path to the project to set up (optional, will prompt if not provided)

## Interactive Setup Process

When invoked, this command will:

1. **Determine Target Project**
   - If path provided, use that
   - Otherwise, ask user for the target project path
   - Validate the path exists or offer to create it

2. **Detect Existing Setup**
   - Check if `.claude/` directory exists
   - Check if `CLAUDE.md` exists
   - If existing setup found, ask: Update, Replace, or Cancel

3. **Select Variant**
   - List available variants from the repository's `/variants/` directory
   - Show description of each variant
   - Allow "base only" option for generic projects
   - **Create New Variant** option if no suitable variant exists
     - Invokes `/CreateVariant` to build custom variant
     - Returns to setup with new variant selected

4. **Gather Project Information**
   - Project name (default: directory name)
   - Project description
   - Any variant-specific prompts from manifest

5. **Execute Setup**
   - Copy base layer components
   - Apply variant layer if selected
   - Process templates with provided values
   - Set up GitHub workflows

   **Install/copy placement rules (must follow exactly):**
   - Variant components must be flattened directly into `.claude/agents/`, `.claude/commands/`, and `.claude/tasks/` using the **basename only** of each component file — never a nested per-variant subfolder.
   - `github-workflows/*` → project-root `.github/workflows/`.
   - A variant's `manifest.json` and `README.md` are authoring metadata and are **never** copied into the target project. The project's record of its variant is `.claude/workflow-manifest.json`, which lists every installed file tagged `"layer": "base"` or `"layer": "variant"`.
   - **NEVER create a `.claude/variants/` directory in the target project.** The per-variant folder is a *repository* shape — `variants/<name>/` in the claude-workflow repo — because that is the unit a pull request reviews. A project holds the merged flat result instead. A legacy `.claude/variants/` directory found in a project must be merged into the directories above (`cp -n`, so nothing newer is overwritten) and then **left in place**: it is the user's content, and deleting it is the user's decision.
   - Verify before reporting success — guard each path so a missing directory does not read as a failure:
     ```bash
     for p in .claude/agents .claude/commands .claude/tasks; do
       [ -d "$p" ] && find "$p" -mindepth 1 -type d
     done
     ```
     This must print nothing.

6. **Configure Project Integrations**
   - Detect GitHub repository from git remote (auto-configure)
   - Prompt for Linear team and project selection (via MCP)
   - Prompt for Coda document and page selection (via MCP)
   - Store configuration in `.claude/settings.json` under `projectMetadata`
   - Skip any integration if MCP not available (can configure later)

6.5. **Configure Team Roster**
   - Copy `base/templates/knowledge/team/team-roster.md.template` to `knowledge/team/team-roster.md` in the target project, and `base/templates/knowledge/team/README.md` (the field-by-field roster guide) to `knowledge/team/README.md` alongside it
   - Offer interactive fill-in: for each team member prompt for name, primary role, seniority, and optionally a one-line description; write conservative starting values taken from the roster's `setupDefaults` frontmatter (`velocityBySeniority` for velocityFactor, `startingSkills` for the skills matrix — never hard-code these numbers; the template ships the starting values, and when adding members to an existing project later, the project roster's own frontmatter is the source) and note in the Change Log that values are initial estimates to refine
   - Replace the template's example members (marked "(example)") with the real team; delete any example that is not replaced
   - Skippable: if skipped, leave the template copy in place with its example members and remind the user that planning commands require at least one real member

7. **Post-Setup**
   - Show summary of files created/modified
   - Show configured integrations status
   - Provide next steps guidance

## Setup Modes

### New Project Setup
For empty directories or projects without `.claude/`:
- Creates full directory structure
- Copies all components
- Generates CLAUDE.md from template
- Runs full project integration setup (Linear, Coda, GitHub)

### Update Existing Project
For projects with existing workflow setup:
- Syncs new/updated components
- Preserves local customizations in CLAUDE.md
- Merges settings where possible
- Checks if project metadata is configured
- Offers to configure missing integrations (skips already configured ones)
- If `knowledge/team/` is missing, offer to add it (new in 2.3.0)

### Replace Existing Setup
For projects where you want to start fresh:
- Backs up existing `.claude/` to `.claude.backup/`
- Removes old setup
- Performs fresh installation
- Runs full project integration setup

## Workflow Repository Location

This command expects to be run from within the claude-workflows repository, or requires the `CLAUDE_WORKFLOW_REPO` environment variable to be set to the repository path.

## Examples

```bash
# Set up a new project interactively
/SetupWorkflow /path/to/my-new-project

# Set up current directory (when in target project)
/SetupWorkflow .

# Will prompt for all options
/SetupWorkflow
```

## Implementation

This command uses Claude Code's native file operations to:
1. Read variant manifests and templates
2. Copy files to target project
3. Process template variables
4. Create directory structures
5. Configure project integrations via MCP

No external scripts or dependencies required.

## Creating Custom Variants

If your project type isn't supported by existing variants:

1. During variant selection, choose **"Create New Variant"**
2. Follow the `/CreateVariant` prompts to define your variant
3. Setup continues with your new variant
4. Optionally submit to community with `/SubmitVariant`

Example flow:
```
Variant selection:
  1. base (Generic - any project)
  2. nextjs-development (Next.js with React)
  → 3. Create New Variant...

Creating new variant...
  Name: swift-ios
  Description: iOS development with Swift and SwiftUI
  Project type: swift
  ...

Variant created! Continuing setup with swift-ios...
```

## Tasks Invoked

- `project-metadata.setup` - Configure Linear, Coda, GitHub integrations
- `mcp-sync.verifyConnections` - Check MCP availability before integration setup
- `variant-management.create` - Create new variant (if selected)
- `variant-management.validate` - Validate variant before use

## Related Commands

- `/SetupProjectMeta` - Reconfigure project integrations after initial setup
- `/CreateVariant` - Create a new variant for unsupported project types
- `/SubmitVariant` - Submit variant to community via PR
- `/StartSession` - Begin development session (verifies integrations)
- `/CheckMCPStatus` - Verify MCP connection status
