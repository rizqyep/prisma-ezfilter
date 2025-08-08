// src/utils/queryExtractor.ts
import type { FilteringQuery, QueryExtractor, QueryParams } from '../types';

/**
 * Generic function to extract FilteringQuery from query parameters
 * Framework-agnostic - works with any object that has the expected query parameter structure
 */
export function extractQueryFromParams(queryParams: QueryParams): FilteringQuery {
    const filter: FilteringQuery = {};

    // Parse filters
    if (queryParams.filters) {
        try {
            const filtersValue = Array.isArray(queryParams.filters)
                ? queryParams.filters[0]
                : queryParams.filters;

            filter.filters = typeof filtersValue === 'string'
                ? JSON.parse(filtersValue)
                : filtersValue;
        } catch (error) {
            console.warn('Failed to parse filters:', error);
        }
    }

    // Parse searchFilters
    if (queryParams.searchFilters) {
        try {
            const searchValue = Array.isArray(queryParams.searchFilters)
                ? queryParams.searchFilters[0]
                : queryParams.searchFilters;

            filter.searchFilters = typeof searchValue === 'string'
                ? JSON.parse(searchValue)
                : searchValue;
        } catch (error) {
            console.warn('Failed to parse searchFilters:', error);
        }
    }

    // Parse rangedFilters
    if (queryParams.rangedFilters) {
        try {
            const rangedValue = Array.isArray(queryParams.rangedFilters)
                ? queryParams.rangedFilters[0]
                : queryParams.rangedFilters;

            filter.rangedFilters = typeof rangedValue === 'string'
                ? JSON.parse(rangedValue)
                : rangedValue;
        } catch (error) {
            console.warn('Failed to parse rangedFilters:', error);
        }
    }

    // Parse orderKey
    if (queryParams.orderKey) {
        filter.orderKey = Array.isArray(queryParams.orderKey)
            ? queryParams.orderKey[0]
            : queryParams.orderKey;
    }

    // Parse orderRule
    if (queryParams.orderRule) {
        const orderRule = Array.isArray(queryParams.orderRule)
            ? queryParams.orderRule[0]
            : queryParams.orderRule;
        filter.orderRule = orderRule as 'asc' | 'desc';
    }

    // Parse pagination
    if (queryParams.page) {
        const page = Array.isArray(queryParams.page)
            ? queryParams.page[0]
            : queryParams.page;
        filter.page = parseInt(page, 10);
    }

    if (queryParams.rows) {
        const rows = Array.isArray(queryParams.rows)
            ? queryParams.rows[0]
            : queryParams.rows;
        filter.rows = parseInt(rows, 10);
    }

    return filter;
}

/**
 * Helper function to create a query extractor from any object with query parameters
 */
export function createQueryExtractor(params: QueryParams): QueryExtractor {
    return {
        getQueryParams: () => params
    };
}