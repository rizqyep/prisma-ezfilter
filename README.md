# prisma-ezfilter

A TypeScript package for building dynamic Prisma queries with type-safe filtering, searching, ordering, and range filtering. This package provides a flexible and extensible way to translate standard query parameters into Prisma query options with optional validation and field mapping.

## Features

- 🎯 **Type-safe query building** with full TypeScript support
- 🔍 **Dynamic filtering** with support for exact matches, arrays, and relational data
- 🔎 **Search functionality** with `contains` operator and multi-field search
- 📊 **Range filtering** for dates and numbers with automatic date parsing
- 📝 **Ordering** with customizable sort directions
- 📄 **Pagination** with configurable page sizes
- ✅ **Validation** with customizable specifications
- 🔄 **Field mapping** and transformation support
- 🌐 **Framework-agnostic** query parameter extraction
- 🏗️ **Modular architecture** for easy extension

## Installation

```bash
npm install prisma-ezfilter
```

## Quick Start

### Direct Usage

```typescript
import { BuildQueryFilter, createQueryBuilder } from 'prisma-ezfilter';

// Create a query builder
const queryBuilder = new BuildQueryFilter();

// Define your filter
const filter = {
  filters: {
    status: 'active',
    category: ['tech', 'business'],
    'user.department': 'engineering'
  },
  searchFilters: {
    title: 'react',
    description: 'typescript'
  },
  rangedFilters: [
    {
      key: 'createdAt',
      start: '2023-01-01T00:00:00Z',
      end: '2023-12-31T23:59:59Z'
    }
  ],
  orderKey: 'createdAt',
  orderRule: 'desc',
  page: 1,
  rows: 20
};

// Build the query
const result = queryBuilder.build(filter);

// Use with Prisma
const posts = await prisma.post.findMany(result.query);
```

### From HTTP Query Parameters

```typescript
import { BuildQueryFilter, extractQueryFromParams } from 'prisma-ezfilter';

// Extract from query parameters (framework-agnostic)
const queryParams = {
  filters: '{"status":"active","category":["tech","business"]}',
  searchFilters: '{"title":"react"}',
  orderKey: 'createdAt',
  orderRule: 'desc',
  page: '1',
  rows: '20'
};

const filter = extractQueryFromParams(queryParams);
const queryBuilder = new BuildQueryFilter();
const result = queryBuilder.build(filter);

// Use with Prisma
const posts = await prisma.post.findMany(result.query);
```

## API Reference

### Core Types

#### `FilteringQuery`

```typescript
interface FilteringQuery {
  filters?: Record<string, any | any[] | null>;
  searchFilters?: Record<string, any | any[] | null>;
  rangedFilters?: RangedFilter[];
  orderKey?: string;
  orderRule?: 'asc' | 'desc';
  page?: number;
  rows?: number;
}
```

#### `RangedFilter`

```typescript
interface RangedFilter {
  key: string;
  start: string | number | Date;
  end: string | number | Date;
}
```

#### `QuerySpecification`

```typescript
interface QuerySpecification {
  allowedFields?: string[];
  allowedOperators?: PrismaOperator[];
  allowedRelations?: string[];
  maxPageSize?: number;
  defaultPageSize?: number;
  requiredFields?: string[];
  forbiddenFields?: string[];
}
```

#### `QueryParams` & `QueryExtractor`

```typescript
interface QueryParams {
  [key: string]: string | string[] | undefined;
}

interface QueryExtractor {
  getQueryParams(): QueryParams;
}
```

### BuildQueryFilter Class

#### Constructor

```typescript
new BuildQueryFilter(specification?: QuerySpecification, transformConfig?: TransformConfig)
```

#### Methods

- `build(filter: FilteringQuery): BuildQueryResult` - Builds a query with validation
- `buildWithoutValidation(filter: FilteringQuery): PrismaQueryOptions` - Builds a query without validation
- `validate(filter: FilteringQuery): ValidationResult` - Validates a query without building it
- `setSpecification(specification: QuerySpecification): void` - Updates the specification
- `setTransformConfig(config: TransformConfig): void` - Updates the transform configuration

### Utility Functions

- `createQueryBuilder(specification?, transformConfig?)` - Convenience function to create a query builder
- `buildFilterQuery(filter: FilteringQuery): PrismaQueryOptions` - Builds a query without validation
- `validateQuery(filter: FilteringQuery, specification?): ValidationResult` - Validates a query
- `transformWhereClause(whereConditions, config): any` - Transforms where conditions
- `transformOrderBy(orderBy, config): any` - Transforms order by clause
- `extractQueryFromParams(queryParams: QueryParams): FilteringQuery` - Extracts filter from query parameters
- `createQueryExtractor(params: QueryParams): QueryExtractor` - Creates a query extractor

## Usage Examples

### Basic Usage

```typescript
import { BuildQueryFilter } from 'prisma-ezfilter';

const queryBuilder = new BuildQueryFilter();

const filter = {
  filters: {
    status: 'published',
    authorId: 'user123'
  },
  orderKey: 'createdAt',
  orderRule: 'desc',
  page: 1,
  rows: 10
};

const result = queryBuilder.build(filter);
// result.query contains the Prisma query options
// result.validation contains validation results
```

### Array Filters (OR Conditions)

```typescript
const filter = {
  filters: {
    status: 'active',
    category: ['tech', 'business', 'design'], // Creates OR condition
    priority: [1, 2, 3], // Numbers work too
    'author.department': ['engineering', 'design'] // Relational arrays
  }
};

// Generated SQL equivalent:
// WHERE status = 'active' 
//   AND (category = 'tech' OR category = 'business' OR category = 'design')
//   AND (priority = 1 OR priority = 2 OR priority = 3)
//   AND (author.department = 'engineering' OR author.department = 'design')
```

### Framework Integration

#### Express.js

```typescript
import express from 'express';
import { BuildQueryFilter, extractQueryFromParams } from 'prisma-ezfilter';

const app = express();
const queryBuilder = new BuildQueryFilter();

app.get('/posts', async (req, res) => {
  try {
    // Extract from Express query parameters
    const filter = extractQueryFromParams(req.query);
    const result = queryBuilder.build(filter);
    
    if (!result.validation.isValid) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: result.validation.errors
      });
    }

    // Use with Prisma
    const posts = await prisma.post.findMany(result.query);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Example request:
// GET /posts?filters={"status":"active","category":["tech","business"]}&searchFilters={"title":"react"}&orderKey=createdAt&orderRule=desc&page=1&rows=20
```

#### Hono

```typescript
import { Hono } from 'hono';
import { BuildQueryFilter, extractQueryFromParams } from 'prisma-ezfilter';

const app = new Hono();
const queryBuilder = new BuildQueryFilter();

app.get('/posts', async (c) => {
  try {
    // Extract from Hono query parameters
    const queryParams = c.req.query();
    const filter = extractQueryFromParams(queryParams);
    const result = queryBuilder.build(filter);
    
    if (!result.validation.isValid) {
      return c.json({
        error: 'Invalid query parameters',
        details: result.validation.errors
      }, 400);
    }

    // Use with Prisma
    const posts = await prisma.post.findMany(result.query);
    return c.json(posts);
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});
```

#### Custom Framework Integration

```typescript
import { BuildQueryFilter, extractQueryFromParams, createQueryExtractor } from 'prisma-ezfilter';

// Custom query extractor for any framework
class CustomQueryExtractor {
  private params: any;
  
  constructor(params: any) {
    this.params = params;
  }
  
  getQueryParams() {
    return this.params;
  }
}

// Usage
const customExtractor = new CustomQueryExtractor({
  filters: '{"status":"active"}',
  orderKey: 'createdAt'
});

const queryParams = customExtractor.getQueryParams();
const filter = extractQueryFromParams(queryParams);
const queryBuilder = new BuildQueryFilter();
const result = queryBuilder.build(filter);
```

### With Validation

```typescript
const specification: QuerySpecification = {
  allowedFields: ['title', 'status', 'authorId', 'createdAt'],
  allowedRelations: ['author'],
  maxPageSize: 100,
  forbiddenFields: ['password', 'secret']
};

const queryBuilder = new BuildQueryFilter(specification);

const filter = {
  filters: {
    status: 'published',
    title: 'react' // This will generate a warning if not in allowedFields
  }
};

const result = queryBuilder.build(filter);
console.log(result.validation.warnings); // Check for warnings
```

### With Field Mapping

```typescript
const transformConfig: TransformConfig = {
  fieldMappings: {
    'userName': 'user.name',
    'userEmail': 'user.email'
  },
  fieldNameMappings: {
    'userName': 'name',
    'userEmail': 'email'
  },
  fieldTypeHandlers: {
    'createdAt': {
      type: 'date',
      searchOperator: 'gte'
    }
  }
};

const queryBuilder = new BuildQueryFilter(undefined, transformConfig);

const filter = {
  filters: {
    userName: 'john', // Will be mapped to user.name
    userEmail: 'john@example.com' // Will be mapped to user.email
  }
};

const result = queryBuilder.build(filter);
```

### Relational Queries

```typescript
const filter = {
  filters: {
    'author.department': 'engineering', // Query on related model
    'tags.name': ['react', 'typescript'] // Array of values creates OR condition
  },
  searchFilters: {
    'author.name': 'john', // Search in related model
    title: 'react' // Search in main model
  }
};
```

### Range Filtering

```typescript
const filter = {
  rangedFilters: [
    {
      key: 'createdAt',
      start: '2023-01-01T00:00:00Z',
      end: '2023-12-31T23:59:59Z'
    },
    {
      key: 'price',
      start: 10,
      end: 100
    }
  ]
};
```

### Complex Queries

```typescript
const filter = {
  filters: {
    status: 'published',
    category: ['tech', 'business'],
    'author.verified': true
  },
  searchFilters: {
    title: 'react',
    'author.name': 'john'
  },
  rangedFilters: [
    {
      key: 'createdAt',
      start: '2023-01-01T00:00:00Z',
      end: '2023-12-31T23:59:59Z'
    }
  ],
  orderKey: 'createdAt',
  orderRule: 'desc',
  page: 2,
  rows: 25
};
```

## Query Parameter Format

The package supports standard query parameters that can be sent via HTTP requests:

### Supported Parameters

- `filters` - JSON string containing exact match filters
- `searchFilters` - JSON string containing search filters (uses `contains` operator)
- `rangedFilters` - JSON string containing range filters
- `orderKey` - Field name for ordering
- `orderRule` - Order direction (`asc` or `desc`)
- `page` - Page number for pagination
- `rows` - Number of rows per page

### Example HTTP Request

```bash
GET /posts?filters={"status":"active","category":["tech","business"]}&searchFilters={"title":"react"}&orderKey=createdAt&orderRule=desc&page=1&rows=20
```

### Array Support

Arrays in filters automatically create OR conditions:

```javascript
// Single value
filters: '{"status":"active"}'
// SQL: WHERE status = 'active'

// Array values
filters: '{"category":["tech","business","design"]}'
// SQL: WHERE (category = 'tech' OR category = 'business' OR category = 'design')

// Mixed types
filters: '{"status":"active","category":["tech","business"],"priority":[1,2,3]}'
// SQL: WHERE status = 'active' AND (category = 'tech' OR category = 'business') AND (priority = 1 OR priority = 2 OR priority = 3)
```

## Advanced Features

### Custom Type Handlers

```typescript
const transformConfig: TransformConfig = {
  fieldTypeHandlers: {
    'price': {
      type: 'number',
      searchOperator: 'gte'
    },
    'isActive': {
      type: 'boolean'
    },
    'customField': {
      type: 'custom',
      customHandler: (value) => {
        // Custom transformation logic
        return { equals: value.toUpperCase() };
      }
    }
  }
};
```

### Custom Relation Handlers

```typescript
const transformConfig: TransformConfig = {
  relationHandlers: {
    'user': {
      type: 'one-to-many',
      relationQuery: 'some',
      customHandler: (value, field) => {
        return {
          some: {
            [field]: value
          }
        };
      }
    }
  }
};
```

## Error Handling

```typescript
const result = queryBuilder.build(filter);

if (!result.validation.isValid) {
  console.error('Validation errors:', result.validation.errors);
  return;
}

if (result.validation.warnings.length > 0) {
  console.warn('Validation warnings:', result.validation.warnings);
}

// Use the query
const data = await prisma.model.findMany(result.query);
```

## Testing

The package includes comprehensive end-to-end tests that cover:

- ✅ Query parameter extraction from HTTP requests
- ✅ Array filter processing (OR conditions)
- ✅ Relational query handling
- ✅ Search filter functionality
- ✅ Range filter processing
- ✅ Validation with specifications
- ✅ Error handling for malformed data
- ✅ Framework-agnostic query extraction

Run tests with:

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.