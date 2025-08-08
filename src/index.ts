// src/index.ts (updated)
// Main exports
export { BuildQueryFilter } from './BuildQueryFilter';

// Type exports
export type {
    BuildQueryResult, FieldMappings,
    FieldNameMappings, FieldTypeHandler, FilteringQuery, OrderDirection,
    PrismaOperator, PrismaOrderBy, PrismaQueryOptions,
    PrismaWhereCondition, QueryExtractor, QueryParams, QuerySpecification, RangedFilter, RelationHandler, TransformConfig, ValidationResult
} from './types';

// Utility function exports
export { buildFilterQuery } from './builders/queryBuilder';
export { transformOrderBy, transformWhereClause } from './transformers/queryTransformer';
export { createQueryExtractor, extractQueryFromParams } from './utils/queryExtractor';
export { validateQuery } from './utils/validation';

// Convenience function for quick usage
import { BuildQueryFilter } from './BuildQueryFilter';
import type { QuerySpecification, TransformConfig } from './types';

export function createQueryBuilder(
    specification?: QuerySpecification,
    transformConfig?: TransformConfig
): BuildQueryFilter {
    return new BuildQueryFilter(specification, transformConfig);
}