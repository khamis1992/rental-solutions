import { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js';

/**
 * Type-safe helper for handling Supabase query results
 * @param result Supabase query result with data and error properties
 * @param defaultValue Optional default value to return if there's an error
 * @returns The data from the query or the default value if there was an error
 */
export function handleQueryResult<T>(
  result: PostgrestSingleResponse<T>,
  defaultValue: T | null = null
): T | null {
  if (result.error) {
    console.error('Supabase query error:', result.error);
    return defaultValue;
  }
  return result.data;
}

/**
 * Type guard to check if a value is not null or undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Helper to safely transform data between types
 * Useful when database types and frontend types need mapping
 */
export function mapDbEntityToModel<TDb, TModel>(
  entity: TDb | null,
  mapper: (entity: TDb) => TModel
): TModel | null {
  if (!entity) return null;
  try {
    return mapper(entity);
  } catch (error) {
    console.error('Error mapping entity to model:', error);
    return null;
  }
}

/**
 * Handle collection of query results with proper type safety
 */
export function mapDbEntitiesToModels<TDb, TModel>(
  entities: TDb[] | null,
  mapper: (entity: TDb) => TModel
): TModel[] {
  if (!entities || entities.length === 0) return [];
  
  return entities
    .map(entity => {
      try {
        return mapper(entity);
      } catch (error) {
        console.error('Error mapping entity to model:', error);
        return null;
      }
    })
    .filter(isDefined);
}

/**
 * Extract count from a Supabase count query
 */
export function extractCount(
  result: { count: number | null; error: PostgrestError | null },
  defaultValue: number = 0
): number {
  if (result.error) {
    console.error('Supabase count query error:', result.error);
    return defaultValue;
  }
  return result.count ?? defaultValue;
}

/**
 * Safe parsing for JSON stored in the database
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Error parsing JSON from database:', error);
    return defaultValue;
  }
}

/**
 * Type guard to ensure we have all required properties in an object
 */
export function hasRequiredProperties<T>(
  obj: unknown,
  properties: (keyof T)[]
): obj is T {
  if (typeof obj !== 'object' || obj === null) return false;
  
  return properties.every(prop => 
    Object.prototype.hasOwnProperty.call(obj, prop)
  );
}

/**
 * Convert nullable values to their non-null counterparts with defaults
 */
export function withDefaults<T extends Record<string, any>>(
  obj: Partial<T> | null | undefined, 
  defaults: T
): T {
  if (!obj) return { ...defaults };
  
  const result = { ...defaults };
  
  // Copy properties from the source object
  Object.keys(defaults).forEach(key => {
    if (obj[key as keyof Partial<T>] !== undefined) {
      result[key] = obj[key as keyof Partial<T>] as any;
    }
  });
  
  return result;
}

/**
 * Type-safe helper to ensure proper Supabase response handling for tables with relations
 */
export function processRelationalResponse<T, R>(
  response: PostgrestSingleResponse<any>,
  transformer: (data: any) => T[]
): T[] {
  if (response.error) {
    console.error('Supabase query error:', response.error);
    return [];
  }
  
  try {
    return transformer(response.data || []);
  } catch (error) {
    console.error('Error transforming relational data:', error);
    return [];
  }
}

/**
 * Helper function to safely merge object with a default object
 */
export function mergeSafelyWithDefaults<T extends Record<string, any>>(
  obj: Partial<T> | null | undefined,
  defaults: T
): T {
  if (!obj) return { ...defaults };
  
  const result = { ...defaults };
  
  // Only copy properties that exist in the defaults object
  Object.keys(defaults).forEach(key => {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  });
  
  return result;
}

/**
 * Cast a Supabase JSON result to a strongly typed object
 * @param jsonData JSON data from Supabase
 * @param defaultValue Default value if parsing fails
 * @returns Typed object
 */
export function castJsonToType<T>(
  jsonData: any,
  defaultValue: T
): T {
  if (!jsonData) return defaultValue;
  
  try {
    // If it's already an object, validate it
    if (typeof jsonData === 'object' && jsonData !== null) {
      return jsonData as T;
    }
    
    // If it's a string, parse it
    if (typeof jsonData === 'string') {
      return JSON.parse(jsonData) as T;
    }
    
    return defaultValue;
  } catch (error) {
    console.error('Error casting JSON to type:', error);
    return defaultValue;
  }
}

/**
 * Extract a property from a JSON object with type safety
 * @param jsonData JSON data
 * @param property Property name to extract
 * @param defaultValue Default value if property doesn't exist or isn't the right type
 * @returns The typed property value
 */
export function extractTypedJsonProperty<T>(
  jsonData: any,
  property: string,
  defaultValue: T
): T {
  if (!jsonData || typeof jsonData !== 'object') return defaultValue;
  
  try {
    const value = jsonData[property];
    if (value === undefined) return defaultValue;
    
    // Type checking can be expanded based on your needs
    return value as T;
  } catch (error) {
    console.error(`Error extracting property ${property}:`, error);
    return defaultValue;
  }
}

import { QueryResponse, TypedQuery, AggregationResult, RelationalQueryOptions } from '@/types/supabase.types';

/**
 * Enhanced type-safe helper for handling Supabase query results
 * @param result Supabase query result with data and error properties
 * @param defaultValue Optional default value to return if there's an error
 * @returns The data from the query or the default value if there was an error
 */
export function handleQueryResult<T>(
  result: QueryResponse<T>,
  defaultValue: T | null = null
): T | null {
  if (result.error) {
    console.error('Supabase query error:', result.error);
    return defaultValue;
  }
  return result.data;
}

/**
 * Enhanced function to safely parse typed responses from PostgreSQL JSON
 * @param jsonData JSON data from database
 * @param defaultValue Default value if parsing fails
 * @returns Typed object
 */
export function parseTypedJson<T>(
  jsonData: any,
  defaultValue: T
): T {
  if (!jsonData) return defaultValue;
  
  try {
    // If it's already an object, validate it
    if (typeof jsonData === 'object' && jsonData !== null) {
      return jsonData as T;
    }
    
    // If it's a string, parse it
    if (typeof jsonData === 'string') {
      return JSON.parse(jsonData) as T;
    }
    
    return defaultValue;
  } catch (error) {
    console.error('Error parsing JSON to type:', error);
    return defaultValue;
  }
}

/**
 * Process a relational query with proper type handling
 * @param query The base query
 * @param options Relation options 
 * @returns Typed query builder
 */
export function withRelations<T>(
  query: TypedQuery<T>, 
  options: RelationalQueryOptions
): TypedQuery<T> {
  let enhancedQuery = query;
  
  // Add basic fields
  if (options.includes && options.includes.length > 0) {
    enhancedQuery = query.select(options.includes.join(','));
  }
  
  // Add nested relations
  if (options.nested) {
    Object.entries(options.nested).forEach(([relation, config]) => {
      const nestedFields = config.fields.join(',');
      const relationQuery = `${relation}(${nestedFields})`;
      
      // Extend the select query
      if (enhancedQuery) {
        enhancedQuery = enhancedQuery.select(relationQuery);
      }
    });
  }
  
  return enhancedQuery;
}

/**
 * Type-safe helper for aggregation queries
 * @param result Query result containing aggregation data
 * @returns Structured aggregation result
 */
export function handleAggregationResult(
  result: QueryResponse<any>
): AggregationResult | null {
  if (result.error) {
    console.error('Aggregation query error:', result.error);
    return null;
  }
  
  // Aggregation results come in various formats depending on the function
  if (!result.data || !result.data[0]) {
    return null;
  }
  
  // Extract aggregation values
  const aggregation: AggregationResult = {};
  const data = result.data[0];
  
  if ('count' in data) aggregation.count = data.count;
  if ('sum' in data) aggregation.sum = data.sum;
  if ('avg' in data) aggregation.avg = data.avg;
  if ('min' in data) aggregation.min = data.min;
  if ('max' in data) aggregation.max = data.max;
  
  return aggregation;
}
