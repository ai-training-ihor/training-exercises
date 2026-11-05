---
name: nextjs-build
description: Handle Next.js build, lint, and type-check operations
---

# Next.js Build Task

Orchestrates Next.js build operations including type checking, linting, and production builds with proper error handling and reporting.

## Operations

### `typecheck`

Run TypeScript type checking.

**Steps:**
1. Execute `tsc --noEmit`
2. Parse TypeScript errors
3. Return structured error report

**Outputs:**
```json
{
  "success": true,
  "errors": [],
  "warnings": [],
  "duration": "2.3s"
}
```

### `lint`

Run ESLint with Next.js configuration.

**Steps:**
1. Execute `next lint`
2. Parse lint results
3. Group by severity and file
4. Return structured report

**Outputs:**
```json
{
  "success": true,
  "errors": [],
  "warnings": [
    {
      "file": "src/components/Button.tsx",
      "line": 10,
      "rule": "react/no-unused-prop-types",
      "message": "Prop 'variant' is unused"
    }
  ],
  "fixable": 2,
  "duration": "1.5s"
}
```

### `build`

Run full production build.

**Steps:**
1. Run type check
2. Run lint
3. Execute `next build`
4. Parse build output
5. Report bundle analysis
6. Return build summary

**Outputs:**
```json
{
  "success": true,
  "typecheck": { "success": true },
  "lint": { "success": true, "warnings": 2 },
  "build": {
    "success": true,
    "pages": [
      { "route": "/", "size": "12.5 kB", "firstLoad": "87.2 kB" },
      { "route": "/api/items", "size": "0 B", "firstLoad": "74.7 kB" }
    ],
    "totalSize": "245 kB",
    "duration": "32s"
  }
}
```

### `analyze`

Analyze bundle and suggest optimizations.

**Steps:**
1. Run build with `ANALYZE=true`
2. Parse bundle analysis
3. Identify large dependencies
4. Suggest optimizations
5. Return analysis report

**Outputs:**
```json
{
  "analysis": {
    "totalSize": "245 kB",
    "largestChunks": [
      { "name": "vendors", "size": "120 kB" }
    ],
    "suggestions": [
      "Consider dynamic import for 'lodash' (42 kB)",
      "Image component unused - remove import"
    ]
  }
}
```

### `precommit`

Run pre-commit checks.

**Steps:**
1. Get staged files
2. Run lint on staged files only
3. Run type check
4. Run affected tests
5. Return pass/fail status

**Outputs:**
```json
{
  "success": true,
  "lint": { "success": true },
  "typecheck": { "success": true },
  "tests": { "success": true, "passed": 5 }
}
```

## Error Handling

| Error | Action |
|-------|--------|
| TypeScript errors | Report all errors, suggest fixes |
| Lint errors | Report errors, offer auto-fix for fixable |
| Build failure | Report error, identify likely cause |
| Out of memory | Suggest NODE_OPTIONS increase |

## Performance Tips

Cached in development:
- Type check results (invalidated on .ts/.tsx change)
- Lint results (invalidated on source change)
- Build cache (.next/cache)

## Integration with CI

When triggered from CI (via `ci-integration` task):
1. Outputs in CI-friendly format
2. Sets exit codes properly
3. Generates artifacts for reporting
4. Supports parallel execution

## Next.js Specific Checks

Additional checks performed:
- Server/Client component boundary validation
- Metadata export validation
- Route segment config validation
- Image optimization check
- API route response validation

## Dependencies

- **git-workflow**: For staged file detection
- **ci-integration**: For CI pipeline integration
- **quality-gates**: For quality threshold checks
