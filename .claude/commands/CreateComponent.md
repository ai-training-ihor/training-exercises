---
name: CreateComponent
description: Create a new React component with TypeScript, tests, and proper structure
---

# /CreateComponent

Create a new React component following project conventions with TypeScript types, tests, and optional Storybook story.

## Usage

```
/CreateComponent <ComponentName> [options]
```

## Arguments

- `ComponentName`: PascalCase name for the component (required)

## Options

- `--type <type>`: Component type (ui, feature, layout) - default: ui
- `--path <path>`: Custom path for the component
- `--with-tests`: Include test file (default: true)
- `--with-story`: Include Storybook story
- `--client`: Mark as client component
- `--server`: Mark as server component (default for App Router)
- `--props <props>`: Comma-separated list of prop names with types

## Examples

```bash
# Create a simple UI component
/CreateComponent Button

# Create a feature component with specific props
/CreateComponent UserCard --type feature --props "user:User,onSelect:function"

# Create a client component with tests and story
/CreateComponent SearchBar --client --with-story --props "onSearch:function,placeholder:string"

# Create a layout component
/CreateComponent DashboardLayout --type layout
```

## Output Structure

```
src/components/{type}/{ComponentName}/
├── {ComponentName}.tsx
├── {ComponentName}.test.tsx    (if --with-tests)
├── {ComponentName}.stories.tsx (if --with-story)
└── index.ts
```

## Workflow

1. **Validate Input**
   - Check ComponentName is PascalCase
   - Verify target path doesn't exist
   - Validate props format if provided

2. **Generate Component**
   - Use `react-component-writer` agent
   - Apply project styling conventions
   - Include proper TypeScript types
   - Add accessibility attributes

3. **Generate Tests**
   - Create test file with react-testing-library
   - Include basic render test
   - Add interaction tests for props

4. **Generate Story** (if requested)
   - Create Storybook story
   - Include variants as stories
   - Add controls for props

5. **Export**
   - Create index.ts barrel export
   - Update parent index if exists

## Generated Component Template

```typescript
// {ComponentName}.tsx
import { type FC } from 'react';
import { cn } from '@/lib/utils';

interface {ComponentName}Props {
  className?: string;
  // Generated props
}

export const {ComponentName}: FC<{ComponentName}Props> = ({
  className,
  ...props
}) => {
  return (
    <div className={cn('', className)} {...props}>
      {/* Component content */}
    </div>
  );
};
```

## Related Commands

- `/ImplementFeature` - For implementing complete features
- `/GenerateTests` - For generating additional tests
- `/ReviewCode` - For reviewing the generated component
