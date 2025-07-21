import { useCallback, useEffect, useState } from 'react';
import { apiService, ApiKeyStatusResponse } from '@/services/api-service';
import { useToastManager } from '@/hooks/use-toast-manager';

export interface ApiKeyConfig {
  name: string;
  value: string;
  isValid: boolean | null;
  isRequired: boolean;
  isConfigured: boolean;
}

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<Record<string, ApiKeyConfig>>({});
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<Set<string>>(new Set());
  const { success, error } = useToastManager();

  const apiKeyNames = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'GROQ_API_KEY',
    'DEEPSEEK_API_KEY',
    'GOOGLE_API_KEY',
    'FINANCIAL_DATASETS_API_KEY'
  ];

  // Load API keys from localStorage and server status
  const loadApiKeys = useCallback(async () => {
    setLoading(true);
    try {
      // Get server status
      const serverStatus = await apiService.getApiKeyStatus();
      
      // Load from localStorage and combine with server status
      const keys: Record<string, ApiKeyConfig> = {};
      
      apiKeyNames.forEach(name => {
        const localValue = apiService.getApiKey(name) || '';
        const serverInfo = serverStatus[name.split('_')[0].toLowerCase()];
        
        keys[name] = {
          name,
          value: localValue,
          isValid: null,
          isRequired: serverInfo?.required || false,
          isConfigured: serverInfo?.configured || false
        };
      });
      
      setApiKeys(keys);
    } catch (err) {
      console.error('Failed to load API keys:', err);
      error('Failed to load API key status');
    } finally {
      setLoading(false);
    }
  }, [error]);

  // Save API key
  const saveApiKey = useCallback(async (name: string, value: string) => {
    try {
      apiService.saveApiKey(name, value);
      setApiKeys(prev => ({
        ...prev,
        [name]: {
          ...prev[name],
          value: value.trim(),
          isValid: null // Reset validation status
        }
      }));
      success(`${name} saved successfully`);
    } catch (err) {
      error(`Failed to save ${name}`);
    }
  }, [success, error]);

  // Test API key
  const testApiKey = useCallback(async (name: string) => {
    const apiKey = apiKeys[name];
    if (!apiKey?.value.trim()) {
      error(`Cannot test ${name}: No API key provided`);
      return;
    }

    setTesting(prev => new Set(prev).add(name));
    
    try {
      const provider = name.split('_')[0].toLowerCase();
      const testEndpoints: Record<string, string> = {
        'openai': 'https://api.openai.com/v1/models',
        'anthropic': 'https://api.anthropic.com/v1/messages',
        'groq': 'https://api.groq.com/openai/v1/models',
        'deepseek': 'https://api.deepseek.com/v1/models',
        'google': 'https://generativelanguage.googleapis.com/v1/models',
        'financial': 'https://api.financialdatasets.ai/company/facts'
      };

      const result = await apiService.testApiKey({
        provider,
        apiKey: apiKey.value.trim(),
        testEndpoint: testEndpoints[provider] || ''
      });

      setApiKeys(prev => ({
        ...prev,
        [name]: {
          ...prev[name],
          isValid: result.success
        }
      }));

      if (result.success) {
        success(`${name} is valid`);
      } else {
        error(`${name} test failed: ${result.message}`);
      }
    } catch (err) {
      setApiKeys(prev => ({
        ...prev,
        [name]: {
          ...prev[name],
          isValid: false
        }
      }));
      error(`Failed to test ${name}`);
    } finally {
      setTesting(prev => {
        const newSet = new Set(prev);
        newSet.delete(name);
        return newSet;
      });
    }
  }, [apiKeys, success, error]);

  // Save all API keys
  const saveAllApiKeys = useCallback(async () => {
    try {
      Object.entries(apiKeys).forEach(([name, config]) => {
        apiService.saveApiKey(name, config.value);
      });
      success('All API keys saved successfully');
    } catch (err) {
      error('Failed to save API keys');
    }
  }, [apiKeys, success, error]);

  // Update API key value
  const updateApiKey = useCallback((name: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        value,
        isValid: null // Reset validation when value changes
      }
    }));
  }, []);

  // Check if all required keys are configured
  const hasRequiredKeys = useCallback(() => {
    return Object.values(apiKeys).every(config => 
      !config.isRequired || config.value.trim().length > 0
    );
  }, [apiKeys]);

  // Get missing required keys
  const getMissingRequiredKeys = useCallback(() => {
    return Object.values(apiKeys)
      .filter(config => config.isRequired && !config.value.trim())
      .map(config => config.name);
  }, [apiKeys]);

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  return {
    apiKeys,
    loading,
    testing,
    saveApiKey,
    testApiKey,
    saveAllApiKeys,
    updateApiKey,
    loadApiKeys,
    hasRequiredKeys,
    getMissingRequiredKeys
  };
}