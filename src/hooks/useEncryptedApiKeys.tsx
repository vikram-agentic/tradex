import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ApiKeyService =
  | 'anthropic'
  | 'alpaca_paper_key'
  | 'alpaca_paper_secret'
  | 'alpaca_live_key'
  | 'alpaca_live_secret'
  | 'newsApi';

export interface ApiKey {
  service: ApiKeyService;
  created_at: string;
  updated_at: string;
}

export const useEncryptedApiKeys = () => {
  const [loading, setLoading] = useState(false);

  const saveApiKey = async (service: ApiKeyService, key: string) => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('manage-api-keys', {
        body: {
          action: 'save',
          service,
          key
        }
      });

      if (response.error) throw response.error;

      const data = response.data as { success: boolean; message: string };

      if (!data.success) {
        throw new Error('Failed to save API key');
      }

      toast.success('API key saved securely');
      return true;
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save API key');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getApiKey = async (service: ApiKeyService): Promise<string | null> => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('manage-api-keys', {
        body: {
          action: 'get',
          service
        }
      });

      if (response.error) throw response.error;

      const data = response.data as { success: boolean; key: string | null };

      return data.key;
    } catch (error) {
      console.error('Error retrieving API key:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async (service: ApiKeyService) => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('manage-api-keys', {
        body: {
          action: 'delete',
          service
        }
      });

      if (response.error) throw response.error;

      const data = response.data as { success: boolean; message: string };

      if (!data.success) {
        throw new Error('Failed to delete API key');
      }

      toast.success('API key deleted');
      return true;
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete API key');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const listApiKeys = async (): Promise<ApiKey[]> => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('manage-api-keys', {
        body: {
          action: 'list'
        }
      });

      if (response.error) throw response.error;

      const data = response.data as { success: boolean; keys: ApiKey[] };

      return data.keys || [];
    } catch (error) {
      console.error('Error listing API keys:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    saveApiKey,
    getApiKey,
    deleteApiKey,
    listApiKeys
  };
};
