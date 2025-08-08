import {
    FieldTypeHandler,
    TransformConfig
} from '../types';

/**
 * Transforms where conditions using field mappings and type handlers
 */
export function transformWhereClause(
    whereConditions: any,
    config: TransformConfig,
): any {
    if (!whereConditions) return whereConditions;

    const {
        fieldMappings,
        fieldNameMappings = {},
        fieldTypeHandlers = {},
        relationHandlers = {},
    } = config;

    const transformCondition = (condition: any): any => {
        const transformed: any = {};

        for (const [key, value] of Object.entries(condition)) {
            if (value === null || value === undefined) continue;

            const relation = fieldMappings[key];
            const actualField = fieldNameMappings[key] || key;
            const typeHandler = fieldTypeHandlers[key];
            const relationHandler = relationHandlers[key];

            if (relation) {
                if (relationHandler && relationHandler.customHandler) {
                    const result = relationHandler.customHandler(value, actualField);
                    if (result !== null) {
                        transformed[relation] = result;
                    }
                } else {
                    const processedValue = processFieldValue(value, typeHandler);
                    if (processedValue !== null) {
                        if (!transformed[relation]) transformed[relation] = {};
                        transformed[relation][actualField] = processedValue;
                    }
                }
            } else {
                const processedValue = processFieldValue(value, typeHandler);
                if (processedValue !== null) {
                    if (actualField !== key) {
                        transformed[actualField] = processedValue;
                    } else {
                        transformed[key] = processedValue;
                    }
                }
            }
        }

        return transformed;
    };

    if (whereConditions.AND && Array.isArray(whereConditions.AND)) {
        const transformedAND = whereConditions.AND.map((condition: any) => {
            if (condition.OR && Array.isArray(condition.OR)) {
                const validORConditions = condition.OR.map((orCond: any) =>
                    transformCondition(orCond),
                ).filter(
                    (condition: any) =>
                        condition && Object.keys(condition).length > 0,
                );

                return validORConditions.length > 0
                    ? { OR: validORConditions }
                    : null;
            }
            return transformCondition(condition);
        }).filter(
            (condition: any) => condition && Object.keys(condition).length > 0,
        );

        return transformedAND.length > 0
            ? { ...whereConditions, AND: transformedAND }
            : {};
    }

    if (whereConditions.OR && Array.isArray(whereConditions.OR)) {
        const transformedOR = whereConditions.OR.map((condition: any) =>
            transformCondition(condition),
        ).filter(
            (condition: any) => condition && Object.keys(condition).length > 0,
        );

        return transformedOR.length > 0
            ? { ...whereConditions, OR: transformedOR }
            : {};
    }

    return transformCondition(whereConditions);
}

/**
 * Transforms order by clause using field mappings
 */
export function transformOrderBy(orderBy: any, config: TransformConfig): any {
    if (!orderBy || Object.keys(orderBy).length === 0) return orderBy;

    const {
        fieldMappings,
        fieldNameMappings = {},
        relationHandlers = {},
    } = config;

    const [field] = Object.keys(orderBy);
    const direction = orderBy[field];

    const relation = fieldMappings[field];
    const actualField = fieldNameMappings[field] || field;
    const relationHandler = relationHandlers[field];

    if (relation) {
        if (relationHandler && relationHandler.customHandler) {
            return relationHandler.customHandler(direction, actualField);
        } else {
            const nestedField = relationHandler?.nestedField || actualField;
            return {
                [relation]: {
                    [nestedField]: direction,
                },
            };
        }
    }

    if (actualField !== field) {
        return {
            [actualField]: direction,
        };
    }

    return orderBy;
}

/**
 * Extracts raw value from Prisma condition objects
 */
function extractRawValue(value: any): any {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return value;
    }

    if ('contains' in value) {
        return typeof value.contains === 'object'
            ? extractRawValue(value.contains)
            : value.contains;
    }
    if ('equals' in value) {
        return typeof value.equals === 'object'
            ? extractRawValue(value.equals)
            : value.equals;
    }
    if ('startsWith' in value) {
        return value.startsWith;
    }
    if ('endsWith' in value) {
        return value.endsWith;
    }

    const keys = Object.keys(value);
    if (keys.length > 0) {
        return value[keys[0]];
    }

    return value;
}

/**
 * Processes field values based on type handlers
 */
function processFieldValue(value: any, typeHandler?: FieldTypeHandler): any {
    const rawValue = extractRawValue(value);

    if (!typeHandler) {
        if (typeof rawValue === 'string') {
            return { contains: rawValue };
        } else if (
            rawValue &&
            typeof rawValue === 'object' &&
            !Array.isArray(rawValue)
        ) {
            return rawValue;
        } else {
            return { equals: rawValue };
        }
    }

    if (typeHandler.customHandler) {
        return typeHandler.customHandler(rawValue);
    }

    switch (typeHandler.type) {
        case 'number':
            const numValue =
                typeof rawValue === 'string' ? Number(rawValue) : rawValue;
            if (isNaN(numValue)) return null;
            return { [typeHandler.searchOperator || 'equals']: numValue };

        case 'boolean':
            const boolValue =
                typeof rawValue === 'string'
                    ? rawValue.toLowerCase() === 'true'
                    : Boolean(rawValue);
            return { equals: boolValue };

        case 'date':
            const dateValue =
                rawValue instanceof Date ? rawValue : new Date(rawValue);
            if (isNaN(dateValue.getTime())) return null;
            return { [typeHandler.searchOperator || 'equals']: dateValue };

        case 'string':
            return { [typeHandler.searchOperator || 'contains']: rawValue };

        default:
            return { equals: rawValue };
    }
} 