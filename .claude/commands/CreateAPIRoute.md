---
name: CreateAPIRoute
description: Create a new Next.js API route with validation, error handling, and tests
---

# /CreateAPIRoute

Create a new Next.js API route handler with proper validation, error handling, authentication, and tests.

## Usage

```
/CreateAPIRoute <resource> [options]
```

## Arguments

- `resource`: Resource name in kebab-case (required)

## Options

- `--methods <methods>`: HTTP methods to implement (default: GET,POST)
- `--with-id`: Create dynamic [id] route for single resource operations
- `--auth`: Require authentication
- `--validation <schema>`: Path to Zod schema or inline schema definition
- `--prisma`: Include Prisma client integration
- `--no-tests`: Skip test file generation

## Examples

```bash
# Create a basic items API with CRUD operations
/CreateAPIRoute items --methods GET,POST --with-id --prisma

# Create an authenticated users API
/CreateAPIRoute users --auth --methods GET,POST,PATCH,DELETE --with-id

# Create a simple health check endpoint
/CreateAPIRoute health --methods GET

# Create API with inline validation
/CreateAPIRoute posts --validation "title:string,content:string,published:boolean?"
```

## Output Structure

```
app/api/{resource}/
├── route.ts                 # Collection endpoints (GET list, POST create)
├── [id]/
│   └── route.ts            # Item endpoints (GET one, PATCH, DELETE)
└── __tests__/
    └── route.test.ts       # API tests
```

## Workflow

1. **Validate Input**
   - Check resource name is valid
   - Verify target path doesn't exist
   - Parse validation schema if provided

2. **Generate Route Handler**
   - Use `api-route-designer` agent
   - Implement requested HTTP methods
   - Add validation with Zod
   - Include error handling
   - Add authentication if requested

3. **Generate Types**
   - Create request/response types
   - Export validation schemas

4. **Generate Tests**
   - Create API test file
   - Include tests for each endpoint
   - Add error case tests

5. **Update Documentation**
   - Add route to API documentation
   - Include request/response examples

## Generated Route Template

```typescript
// app/api/{resource}/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createSchema = z.object({
  // Generated from --validation or default
});

export async function GET(request: NextRequest) {
  try {
    // Implementation
    return NextResponse.json({ data: [] });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createSchema.parse(body);
    // Implementation
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
```

## HTTP Methods Reference

| Method | Collection (`/api/items`) | Item (`/api/items/[id]`) |
|--------|---------------------------|--------------------------|
| GET    | List all items            | Get single item          |
| POST   | Create new item           | -                        |
| PATCH  | -                         | Update item              |
| PUT    | -                         | Replace item             |
| DELETE | -                         | Delete item              |

## Related Commands

- `/ImplementFeature` - For implementing complete features
- `/CreateComponent` - For creating frontend components
- `/GenerateTests` - For additional test coverage
