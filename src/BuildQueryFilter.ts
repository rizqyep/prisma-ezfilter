import { buildFilterQuery } from './builders/queryBuilder';
import { transformOrderBy, transformWhereClause } from './transformers/queryTransformer';
import {
    BuildQueryResult,
    FilteringQuery,
    PrismaQueryOptions,
    QuerySpecification,
    TransformConfig
} from './types';
import { validateQuery } from './utils/validation';

/**
 * Main class for building and validating Prisma queries
 */
export class BuildQueryFilter {
    private specification?: QuerySpecification;
    private transformConfig?: TransformConfig;

    constructor(specification?: QuerySpecification, transformConfig?: TransformConfig) {
        this.specification = specification;
        this.transformConfig = transformConfig;
    }

    /**
     * Builds a Prisma query with validation
     */
    build(filter: FilteringQuery): BuildQueryResult {
        // Validate the query
        const validation = validateQuery(filter, this.specification);

        // Build the base query
        let query = buildFilterQuery(filter);

        // Apply transformations if config is provided
        if (this.transformConfig && query.where) {
            query.where = transformWhereClause(query.where, this.transformConfig);
        }

        if (this.transformConfig && query.orderBy) {
            query.orderBy = transformOrderBy(query.orderBy, this.transformConfig);
        }

        return {
            query,
            validation
        };
    }

    /**
     * Builds a query without validation
     */
    buildWithoutValidation(filter: FilteringQuery): PrismaQueryOptions {
        let query = buildFilterQuery(filter);

        if (this.transformConfig && query.where) {
            query.where = transformWhereClause(query.where, this.transformConfig);
        }

        if (this.transformConfig && query.orderBy) {
            query.orderBy = transformOrderBy(query.orderBy, this.transformConfig);
        }

        return query;
    }

    /**
     * Validates a query without building it
     */
    validate(filter: FilteringQuery) {
        return validateQuery(filter, this.specification);
    }

    /**
     * Updates the specification
     */
    setSpecification(specification: QuerySpecification): void {
        this.specification = specification;
    }

    /**
     * Updates the transform configuration
     */
    setTransformConfig(config: TransformConfig): void {
        this.transformConfig = config;
    }

    /**
     * Gets the current specification
     */
    getSpecification(): QuerySpecification | undefined {
        return this.specification;
    }

    /**
     * Gets the current transform configuration
     */
    getTransformConfig(): TransformConfig | undefined {
        return this.transformConfig;
    }
} 