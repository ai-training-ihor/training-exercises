---
name: CreateVariant
description: Interactively create a new workflow variant for a project type
user_invocable: true
---

# /CreateVariant

Create a new workflow variant for a project type that isn't currently supported. This command guides you through creating all necessary artifacts for a new variant, which can then be submitted to the main repository via pull request.

## Purpose

When setting up a project and no suitable variant exists (e.g., Swift iOS, Flutter, Rust, Go), use this command to create a custom variant with:
- Specialized agents for your technology stack
- Custom commands for common operations
- Technology-specific tasks
- Project structure templates

## Usage

```
/CreateVariant [variant-name]
```

## Arguments

- `variant-name`: Optional variant identifier (lowercase, hyphens). If not provided, will prompt.

## Interactive Creation Process

### 1. Gather Variant Information

Prompts for:
- **Variant name**: Identifier like `swift-ios`, `flutter-mobile`, `rust-backend`
- **Description**: Human-readable description of the variant
- **Project type**: Category (swift, flutter, rust, go, python, etc.)
- **Key technologies**: Main frameworks/tools (SwiftUI, Combine, etc.)

### 2. Define Project Structure

Prompts for common directory patterns:
- Source directory (e.g., `Sources/`, `src/`, `lib/`)
- Test directory (e.g., `Tests/`, `test/`)
- Additional structure (components, modules, etc.)

### 3. Create Core Components

Guides through creating:

#### Specialist Agent
- Technology expert agent
- Expertise areas based on your input
- Best practices and patterns

#### Common Commands (optional)
- Project-specific commands
- Examples: `/CreateView`, `/CreateModule`, `/BuildRelease`

#### Build/Deploy Task (optional)
- Technology-specific build task
- CI/CD integration points

### 4. Generate Files

Where the files go depends on where you are running.

**Inside a target project** (the normal case — the workflow system is installed here):

Author the components directly into the project's flat structure. There is no variant folder:

```
.claude/agents/{name}-specialist.md
.claude/commands/YourCommand.md
.claude/tasks/your-task.md
.github/workflows/your-workflow.yml
```

Then record each file in `.claude/workflow-manifest.json` with `"layer": "variant"`, and fill in
the `variant` block (`name`, `version`, `description`, `projectType`). That manifest is what
distinguishes your handful of variant files from the ~60 base files beside them, and it is what
`/SubmitVariant` reads when it builds the PR.

**Never** create `.claude/variants/{name}/`, and never a per-variant subfolder inside
`.claude/agents/`, `.claude/commands/`, or `.claude/tasks/`. Claude Code does not load components
from nested folders, so a variant written there is installed but inert — this was the cause of the
variant install bug fixed in 2.4.0.

**Inside a clone of the `claude-workflow` repository** (authoring a variant for the repo itself):

```
variants/{name}/
├── manifest.json       # Variant configuration
├── README.md           # Documentation
├── agents/
│   └── {name}-specialist.md
├── commands/           # Custom commands
├── tasks/              # Custom tasks
├── github-workflows/   # Optional CI workflows
└── templates/
    └── CLAUDE.md.variant
```

The repository keeps this per-variant shape because it is the unit a pull request reviews and
versions. A project never mirrors it. When the variant is applied to a project, its components are
**flattened**:

| Variant source | Installed to |
|---|---|
| `{name}/agents/*.md` | `.claude/agents/<basename>.md` |
| `{name}/commands/*.md` | `.claude/commands/<basename>.md` |
| `{name}/tasks/*.md` | `.claude/tasks/<basename>.md` |
| `{name}/github-workflows/*.yml` | `.github/workflows/<basename>.yml` |
| `{name}/templates/*` | the destination named in the manifest (e.g. `CLAUDE.md`) |
| `manifest.json`, `README.md` | **not copied** — the project records its variant in `.claude/workflow-manifest.json` |

### 5. Validate and Summarize

- Runs validation on created variant
- Shows summary of files created
- Provides next steps

## Examples

```bash
# Create a Swift iOS variant
/CreateVariant swift-ios

# Create with prompts
/CreateVariant
# > Variant name: flutter-mobile
# > Description: Flutter mobile development with Dart
# > Project type: flutter
# > ...
```

## Output

After completion:
```
Created variant: swift-ios

Files created (in a target project):
  - .claude/agents/swift-specialist.md      (tracked as "layer": "variant")
  - .claude/workflow-manifest.json          (updated with the variant block)

Files created (in a claude-workflow clone):
  - variants/swift-ios/manifest.json
  - variants/swift-ios/README.md
  - variants/swift-ios/agents/swift-specialist.md
  - variants/swift-ios/templates/CLAUDE.md.variant

Validation: PASSED

Next steps:
1. Review and customize the generated files
2. Add more agents/commands/tasks as needed
3. Test by running: /SetupWorkflow . --variant swift-ios
4. Submit to community: /SubmitVariant swift-ios
```

## Generated Manifest Example

```json
{
  "name": "swift-ios",
  "version": "1.0.0",
  "description": "iOS development with Swift, SwiftUI, and modern Apple frameworks",
  "projectType": "swift",
  "baseVersion": "1.0.0",
  "components": {
    "agents": [
      {
        "name": "swift-specialist",
        "path": "agents/swift-specialist.md",
        "mergeStrategy": "overlay"
      }
    ],
    "commands": [],
    "tasks": [],
    "templates": [
      {
        "source": "templates/CLAUDE.md.variant",
        "destination": "CLAUDE.md",
        "mergeStrategy": "skip_if_exists"
      }
    ]
  },
  "configuration": {
    "projectStructure": {
      "sources": "Sources",
      "tests": "Tests",
      "resources": "Resources"
    },
    "requiredDependencies": []
  }
}
```

## Adding More Components

After initial creation, add components interactively:

```bash
# Add another agent
/CreateVariant swift-ios --add-agent

# Add a command
/CreateVariant swift-ios --add-command

# Add a task
/CreateVariant swift-ios --add-task
```

Or manually create files in the variant directory and update `manifest.json`.

## Integration with SetupWorkflow

When running `/SetupWorkflow` and selecting variants:
- If no suitable variant exists, you'll see "Create New Variant" option
- Selecting it invokes this command
- After creation, setup continues with your new variant

## Related Commands

- `/SubmitVariant` - Submit variant to community via PR
- `/SetupWorkflow` - Use variant to set up a project
- `/CheckMCPStatus` - Verify GitHub CLI for submission

## Tasks Invoked

- `variant-management.create`
- `variant-management.addAgent`
- `variant-management.addCommand`
- `variant-management.addTask`
- `variant-management.validate`

## Notes

- In a project, a variant has no folder: its components live in the flat `.claude/` directories
  and are tracked in `.claude/workflow-manifest.json`. `/SubmitVariant` builds the repo-shaped
  folder on demand and deletes it after opening the PR
- Use `/SubmitVariant` to contribute to the community
- You can use your variant immediately without submitting
- Follow naming conventions: lowercase, hyphens, descriptive
- Installing a variant always produces a flat layout; a `.claude/variants/` folder inside a
  project is a legacy artifact (run the plugin's `/claude-workflow:update` to merge it — nothing
  is deleted)
