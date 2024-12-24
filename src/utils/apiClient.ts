import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from "sonner";

type Tables = Database['public']['Tables'];
type TableName = keyof Tables;

interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

type PostgrestError = {
  message: string;
  details: string;
  hint: string;
  code: string;
};

async function request<T>(
  method: string,
  table: TableName,
  data?: Record<string, unknown>,
  id?: string
): Promise<ApiResponse<T>> {
  try {
    let query = supabase.from(table);
    let result: ApiResponse<T>;

    switch (method) {
      case 'GET': {
        if (id) {
          const { data: fetchedData, error } = await query
            .select('*')
            .eq('id', id)
            .maybeSingle();

          result = {
            data: (fetchedData as unknown) as T,
            error: error as Error | null
          };
        } else {
          const { data: fetchedData, error } = await query.select('*');
          result = {
            data: (fetchedData as unknown) as T,
            error: error as Error | null
          };
        }
        break;
      }

      case 'POST': {
        if (!data) throw new Error('Data is required for POST requests');
        const { data: insertedData, error: insertError } = await query
          .insert(data)
          .select()
          .single();
        result = {
          data: (insertedData as unknown) as T,
          error: insertError as Error | null
        };
        break;
      }

      case 'PUT': {
        if (!id) throw new Error('ID is required for PUT requests');
        if (!data) throw new Error('Data is required for PUT requests');
        const { data: updatedData, error: updateError } = await query
          .update(data)
          .eq('id', id)
          .select()
          .single();
        result = {
          data: (updatedData as unknown) as T,
          error: updateError as Error | null
        };
        break;
      }

      case 'DELETE': {
        if (!id) throw new Error('ID is required for DELETE requests');
        const { data: deletedData, error: deleteError } = await query
          .delete()
          .eq('id', id)
          .select()
          .single();
        result = {
          data: (deletedData as unknown) as T,
          error: deleteError as Error | null
        };
        break;
      }

      default:
        throw new Error(`Unsupported method: ${method}`);
    }

    if (result.error) {
      const pgError = result.error as unknown as PostgrestError;
      console.error(`API Error (${method} ${table}):`, pgError);
      toast.error(`Error: ${pgError.message}`);
    }

    return result;
  } catch (error) {
    console.error(`API Request Failed (${method} ${table}):`, error);
    toast.error('An unexpected error occurred');
    return { data: null, error: error as Error };
  }
}

export const apiClient = {
  get: <T>(table: TableName, id?: string) => request<T>('GET', table, undefined, id),
  post: <T>(table: TableName, data: Record<string, unknown>) => request<T>('POST', table, data),
  put: <T>(table: TableName, id: string, data: Record<string, unknown>) => request<T>('PUT', table, data, id),
  delete: <T>(table: TableName, id: string) => request<T>('DELETE', table, undefined, id),
};