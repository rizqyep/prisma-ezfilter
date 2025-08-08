/**
 * Core types for Prisma Query Builder
 */

export type PrismaOperator =
    | 'equals'
    | 'not'
    | 'in'
    | 'notIn'
    | 'lt'
    | 'lte'
    | 'gt'
    | 'gte'
    | 'contains'
    | 'startsWith'
    | 'endsWith'
    | 'mode'
    | 'search';

export type OrderDirection = 'asc' | 'desc';

export interface RangedFilter {
    key: string;
    start: string | number | Date;
    end: string | number | Date;
}

export interface FilteringQuery {
    filters?: Record<string, any | any[] | null>;
    searchFilters?: Record<string, any | any[] | null>;
    rangedFilters?: RangedFilter[];
    orderKey?: string;
    orderRule?: OrderDirection;
    page?: number;
    rows?: number;
}

export interface PrismaWhereCondition {
    [key: string]: any;
}

export interface PrismaOrderBy {
    [key: string]: OrderDirection;
}

export interface PrismaQueryOptions {
    where?: PrismaWhereCondition;
    orderBy?: PrismaOrderBy | PrismaOrderBy[];
    take?: number;
    skip?: number;
    include?: Record<string, any>;
    select?: Record<string, any>;
}

export interface FieldMappings {
    [frontendField: string]: string;
}

export interface FieldNameMappings {
    [frontendField: string]: string;
}

export interface FieldTypeHandler {
    type: 'string' | 'number' | 'boolean' | 'date' | 'custom';
    searchOperator?: PrismaOperator;
    customHandler?: (value: any) => any;
}

export interface RelationHandler {
    type: 'one-to-many' | 'many-to-many' | 'one-to-one';
    relationQuery: 'some' | 'every' | 'none';
    nestedField?: string;
    customHandler?: (value: any, actualField: string) => any;
}

export interface TransformConfig {
    fieldMappings: Record<string, string>;
    fieldNameMappings?: Record<string, string>;
    fieldTypeHandlers?: Record<string, FieldTypeHandler>;
    relationHandlers?: Record<string, RelationHandler>;
}

export interface QuerySpecification {
    allowedFields?: string[];
    allowedOperators?: PrismaOperator[];
    allowedRelations?: string[];
    maxPageSize?: number;
    defaultPageSize?: number;
    requiredFields?: string[];
    forbiddenFields?: string[];
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export interface BuildQueryResult {
    query: PrismaQueryOptions;
    validation: ValidationResult;
}

// src/types/index.ts (adding the missing types)
export interface QueryParams {
    [key: string]: string | string[] | undefined;
}

export interface QueryExtractor {
    getQueryParams(): QueryParams;
}