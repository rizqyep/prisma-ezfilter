import {
    FilteringQuery,
    QuerySpecification,
    RangedFilter,
    ValidationResult
} from '../types';

/**
 * Validates a filtering query against a specification
 */
export function validateQuery(
    query: FilteringQuery,
    specification?: QuerySpecification
): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!specification) {
        return { isValid: true, errors, warnings };
    }

    // Validate filters
    if (query.filters) {
        validateFilters(query.filters, specification, errors, warnings);
    }

    // Validate search filters
    if (query.searchFilters) {
        validateSearchFilters(query.searchFilters, specification, errors, warnings);
    }

    // Validate ranged filters
    if (query.rangedFilters) {
        validateRangedFilters(query.rangedFilters, specification, errors, warnings);
    }

    // Validate order key
    if (query.orderKey) {
        validateOrderKey(query.orderKey, specification, errors, warnings);
    }

    // Validate pagination
    validatePagination(query, specification, errors);

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

function validateFilters(
    filters: Record<string, any | any[] | null>,
    specification: QuerySpecification,
    errors: string[],
    warnings: string[]
): void {
    for (const [field, value] of Object.entries(filters)) {
        if (value === null || value === undefined) continue;

        // Check if field is allowed
        if (specification.allowedFields && !specification.allowedFields.includes(field)) {
            if (specification.forbiddenFields?.includes(field)) {
                errors.push(`Field '${field}' is forbidden`);
            } else {
                warnings.push(`Field '${field}' is not in allowed fields list`);
            }
        }

        // Check for relational fields
        if (field.includes('.')) {
            const parts = field.split('.');
            const relation = parts[0];
            if (relation && specification.allowedRelations && !specification.allowedRelations.includes(relation)) {
                errors.push(`Relation '${relation}' is not allowed`);
            }
        }
    }
}

function validateSearchFilters(
    searchFilters: Record<string, any | any[] | null>,
    specification: QuerySpecification,
    errors: string[],
    warnings: string[]
): void {
    for (const [field, value] of Object.entries(searchFilters)) {
        if (value === null || value === undefined) continue;

        // Check if field is allowed for search
        if (specification.allowedFields && !specification.allowedFields.includes(field)) {
            warnings.push(`Search field '${field}' is not in allowed fields list`);
        }

        // Check for relational fields
        if (field.includes('.')) {
            const parts = field.split('.');
            const relation = parts[0];
            if (relation && specification.allowedRelations && !specification.allowedRelations.includes(relation)) {
                errors.push(`Search relation '${relation}' is not allowed`);
            }
        }
    }
}

function validateRangedFilters(
    rangedFilters: RangedFilter[],
    specification: QuerySpecification,
    errors: string[],
    warnings: string[]
): void {
    for (const range of rangedFilters) {
        // Check if field is allowed
        if (specification.allowedFields && !specification.allowedFields.includes(range.key)) {
            warnings.push(`Range field '${range.key}' is not in allowed fields list`);
        }

        // Check for relational fields
        if (range.key.includes('.')) {
            const parts = range.key.split('.');
            const relation = parts[0];
            if (relation && specification.allowedRelations && !specification.allowedRelations.includes(relation)) {
                errors.push(`Range relation '${relation}' is not allowed`);
            }
        }

        // Validate date ranges
        if (isValidDate(range.start) && isValidDate(range.end)) {
            const startDate = new Date(range.start);
            const endDate = new Date(range.end);

            if (startDate > endDate) {
                errors.push(`Range start date '${range.start}' is after end date '${range.end}'`);
            }
        }
    }
}

function validateOrderKey(
    orderKey: string,
    specification: QuerySpecification,
    errors: string[],
    warnings: string[]
): void {
    if (specification.allowedFields && !specification.allowedFields.includes(orderKey)) {
        warnings.push(`Order field '${orderKey}' is not in allowed fields list`);
    }

    if (orderKey.includes('.')) {
        const parts = orderKey.split('.');
        const relation = parts[0];
        if (relation && specification.allowedRelations && !specification.allowedRelations.includes(relation)) {
            errors.push(`Order relation '${relation}' is not allowed`);
        }
    }
}

function validatePagination(
    query: FilteringQuery,
    specification: QuerySpecification,
    errors: string[]
): void {
    if (query.page !== undefined && query.page < 1) {
        errors.push('Page number must be greater than 0');
    }

    if (query.rows !== undefined) {
        if (query.rows < 1) {
            errors.push('Rows per page must be greater than 0');
        } else if (specification.maxPageSize && query.rows > specification.maxPageSize) {
            errors.push(`Rows per page cannot exceed ${specification.maxPageSize}`);
        }
    }
}

function isValidDate(dateString: any): boolean {
    if (typeof dateString !== 'string') {
        return false;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
    return dateRegex.test(dateString);
} 