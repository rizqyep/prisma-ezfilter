import {
    FilteringQuery,
    OrderDirection,
    PrismaQueryOptions,
    PrismaWhereCondition,
    RangedFilter
} from '../types';

/**
 * Builds a Prisma query from filtering parameters
 */
export function buildFilterQuery(filter: FilteringQuery): PrismaQueryOptions {
    const query: PrismaQueryOptions = {
        where: {
            AND: [],
        },
        orderBy: {},
    };

    // Build where conditions
    if (filter.filters) {
        const whereConditions = buildWhereQuery(filter.filters);
        query.where!['AND'] = [...(query.where!['AND'] as any[]), ...whereConditions];
    }

    if (filter.searchFilters) {
        const searchConditions = buildSearchQuery(filter.searchFilters);
        query.where!['AND'] = [...(query.where!['AND'] as any[]), ...searchConditions];
    }

    if (filter.rangedFilters) {
        const rangeConditions = buildRangedFilter(filter.rangedFilters);
        query.where!['AND'] = [...(query.where!['AND'] as any[]), ...rangeConditions];
    }

    // Build order by
    if (filter.orderKey) {
        const orderRule: OrderDirection = filter.orderRule ?? 'asc';
        query.orderBy = {
            [filter.orderKey]: orderRule,
        };
    }

    // Build pagination
    const { take, skip } = buildPagination(filter);
    query.take = take;
    query.skip = skip;

    return query;
}

/**
 * Builds where conditions from filters
 */
function buildWhereQuery(filters: Record<string, any | any[] | null>): PrismaWhereCondition[] {
    const whereConditions: PrismaWhereCondition[] = [];

    for (const [key, value] of Object.entries(filters)) {
        if (value === null || value === undefined) continue;

        // Handle relational data filter (only 1 level is allowed)
        if (key.includes('.')) {
            const parts = key.split('.');
            const relation = parts[0];
            const column = parts[1];

            if (Array.isArray(value)) {
                const orQueryArray = value.map((val) => ({
                    [relation]: {
                        [column]: val,
                    },
                }));
                whereConditions.push({
                    OR: orQueryArray,
                });
            } else {
                whereConditions.push({
                    [relation]: {
                        [column]: value,
                    },
                });
            }
            continue;
        }

        // Handle regular fields
        if (Array.isArray(value)) {
            const orQueryArray = value.map((val) => ({
                [key]: val,
            }));
            whereConditions.push({
                OR: orQueryArray,
            });
        } else {
            whereConditions.push({
                [key]: value,
            });
        }
    }

    return whereConditions;
}

/**
 * Builds search conditions from search filters
 */
function buildSearchQuery(searchFilters: Record<string, any | any[] | null>): PrismaWhereCondition[] {
    const whereConditions: PrismaWhereCondition[] = [];
    const orQuerySearchArray: PrismaWhereCondition[] = [];

    const isMultiKey = Object.values(searchFilters).length > 1;

    for (const [key, value] of Object.entries(searchFilters)) {
        if (value === null || value === undefined) continue;

        let searchQuery: PrismaWhereCondition = {};

        if (key.includes('.')) {
            const parts = key.split('.');
            const relation = parts[0];
            const column = parts[1];

            searchQuery = {
                [relation]: {
                    [column]: {
                        contains: value,
                    },
                },
            };
        } else {
            searchQuery = {
                [key]: {
                    contains: value,
                },
            };
        }

        if (isMultiKey) {
            orQuerySearchArray.push(searchQuery);
        } else {
            whereConditions.push(searchQuery);
        }
    }

    if (isMultiKey && orQuerySearchArray.length > 0) {
        whereConditions.push({
            OR: orQuerySearchArray,
        });
    }

    return whereConditions;
}

/**
 * Builds ranged filter conditions
 */
function buildRangedFilter(rangedFilters: RangedFilter[]): PrismaWhereCondition[] {
    const whereConditions: PrismaWhereCondition[] = [];

    for (const range of rangedFilters) {

        if (range.key.includes('.')) {
            const parts = range.key.split('.');
            const relation = parts[0];
            const column = parts[1];
            whereConditions.push({
                [relation]: {
                    [column]: {
                        gte: range.start,
                        lte: range.end,
                    },
                },
            });
        } else {
            whereConditions.push({
                [range.key]: {
                    gte: range.start,
                    lte: range.end,
                },
            });
        }
    }

    return whereConditions;
}

/**
 * Builds pagination parameters
 */
function buildPagination(filter: FilteringQuery): { take: number; skip: number } {
    let take = 10;
    let skip = 0;

    if (filter.page) {
        if (filter.rows) {
            skip = (filter.page - 1) * filter.rows;
            take = filter.rows;
        } else {
            skip = 10 * (filter.page - 1);
        }
    }

    return { take, skip };
} 