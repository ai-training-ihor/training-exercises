# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**training-exercises** - AI Tool Assistance System - Training Exercises (Field Service Dashboard).
A Next.js application using the App Router with TypeScript.

## Repository Structure

```
src/
├── app/                  # Next.js App Router pages and layouts
│   ├── api/              # API route handlers
│   ├── (auth)/           # Auth-related route group
│   ├── (dashboard)/      # Dashboard route group
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── ui/               # Base UI components
│   ├── features/         # Feature-specific components
│   └── layouts/          # Layout components
├── lib/                  # Utility functions and shared logic
│   ├── utils.ts          # General utilities
│   ├── prisma.ts         # Prisma client
│   └── auth.ts           # Authentication utilities
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── styles/               # Global styles
public/                   # Static assets
docs/                     # Documentation
├── planning/             # Session plans and state
└── specs/                # Technical specifications
knowledge/                # Requirements and architecture
├── prd/                  # Product requirements
└── architecture/         # Architecture documentation
```

## Development Guidelines

### Next.js Patterns

#### Server vs Client Components
- **Default to Server Components** - they render on the server and reduce client bundle size
- Use `'use client'` directive only when you need:
  - Event handlers (onClick, onChange, etc.)
  - Browser APIs (window, document, localStorage)
  - State or effects (useState, useEffect)
  - Client-side libraries

#### Data Fetching
```typescript
// Prefer server-side data fetching in components
async function Page() {
  const data = await prisma.items.findMany();
  return <ItemList items={data} />;
}

// Use server actions for mutations
'use server'
async function createItem(formData: FormData) {
  await prisma.items.create({ data: {...} });
  revalidatePath('/items');
}
```

#### Route Organization
- Use route groups `(name)` for shared layouts without URL impact
- Use dynamic routes `[param]` for parameterized pages
- Use catch-all routes `[...slug]` for flexible paths
- Place API routes in `app/api/`

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for formatting
- Prefer named exports over default exports
- Use absolute imports with `@/` prefix

### Component Patterns

```typescript
// Standard component structure
import { type FC } from 'react';
import { cn } from '@/lib/utils';

interface ComponentProps {
  className?: string;
}

export const Component: FC<ComponentProps> = ({ className }) => {
  return <div className={cn('base-styles', className)} />;
};
```

### API Routes

```typescript
// Standard API route structure
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({ /* validation */ });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    // ... handle request
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
```

## Workflow Integration

This project uses the Claude Workflow System for development operations.

### Available Commands
- `/StartSession` - Initialize a development session
- `/EndSession` - Close session and optionally trigger CI
- `/SessionStatus` - View current session state
- `/CreateComponent` - Create a new React component
- `/CreateAPIRoute` - Create a new API route
- `/ImplementFeature` - Start feature implementation workflow
- `/FixBug` - Start bug investigation workflow
- `/ReviewCode` - Request code review
- `/GenerateTests` - Generate test specifications

### Session Management
- Start each development session with `/StartSession`
- Session state is tracked in `/docs/planning/session-state.json`
- End sessions with `/EndSession` to persist progress

## Environment Setup

### Prerequisites
- Node.js 18+
- npm or pnpm
- Database (PostgreSQL recommended)

### Installation
```bash
npm install
```

### Environment Variables
Copy `.env.example` to `.env.local` and configure:
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

### Development Server
```bash
npm run dev
```

### Running Tests
```bash
npm run test        # Run tests
npm run test:watch  # Watch mode
```

### Building
```bash
npm run build       # Production build
npm run start       # Start production server
```

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `/docs/planning/` | Session plans and current state |
| `/docs/specs/` | Technical specifications |
| `/knowledge/prd/` | Product requirements documents |
| `/knowledge/architecture/` | Architecture documentation |

## Important Conventions

### Commit Messages
Follow conventional commits:
```
type(scope): description

feat(auth): add OAuth login
fix(api): handle null response
docs(readme): update setup instructions
```

### Branch Naming
- Features: `feature/{issue-id}-{description}`
- Bug fixes: `fix/{issue-id}-{description}`
- Refactoring: `refactor/{description}`

### Testing
- Use React Testing Library for components
- Use MSW for API mocking in tests
- Aim for meaningful coverage, not 100%

### Accessibility
- All interactive elements must be keyboard accessible
- Use semantic HTML elements
- Include ARIA attributes where needed
- Test with screen readers

## Agent Routing

This project uses the **nextjs-development** variant. When performing coding tasks:
- Prefer the variant's specialists for work in their domain
- Variant agents:
  - `nextjs-specialist` - Next.js App Router architecture, server/client components, data fetching
  - `react-component-writer` - React component creation with TypeScript and tests
  - `api-route-designer` - Next.js API route design with validation and error handling
- Fall back to the base `code-writer` for generic code no specialist covers (build scripts,
  config, plain utility modules)
- Base agents retained for: review, testing, documentation, planning, analysis
