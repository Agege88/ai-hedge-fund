const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface TestApiKeyRequest {
  provider: string;
  apiKey: string;
  testEndpoint: string;
}

export interface TestApiKeyResponse {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

export interface ApiKeyStatus {
  configured: boolean;
  required: boolean;
}

export interface ApiKeyStatusResponse {
  [provider: string]: ApiKeyStatus;
}

export const apiService = {
  /**
   * Test if an API key is valid
   */
  async testApiKey(request: TestApiKeyRequest): Promise<TestApiKeyResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/test-api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to test API key:', error);
      throw error;
    }
  },

  /**
   * Get the status of API keys (without exposing actual keys)
   */
  async getApiKeyStatus(): Promise<ApiKeyStatusResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/api-key-status`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get API key status:', error);
      throw error;
    }
  },

  /**
   * Save API key to localStorage
   */
  saveApiKey(name: string, value: string): void {
    try {
      if (value.trim()) {
        localStorage.setItem(`api_key_${name}`, value.trim());
      } else {
        localStorage.removeItem(`api_key_${name}`);
      }
    } catch (error) {
      console.error(`Failed to save API key ${name}:`, error);
      throw error;
    }
  },

  /**
   * Get API key from localStorage
   */
  getApiKey(name: string): string | null {
    try {
      return localStorage.getItem(`api_key_${name}`);
    } catch (error) {
      console.error(`Failed to get API key ${name}:`, error);
      return null;
    }
  },

  /**
   * Get all API keys from localStorage
   */
  getAllApiKeys(): Record<string, string> {
    const keys: Record<string, string> = {};
    const apiKeyNames = [
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'GROQ_API_KEY',
      'DEEPSEEK_API_KEY',
      'GOOGLE_API_KEY',
      'FINANCIAL_DATASETS_API_KEY'
    ];

    apiKeyNames.forEach(name => {
      const value = this.getApiKey(name);
      if (value) {
        keys[name] = value;
      }
    });

    return keys;
  },

  /**
   * Clear all API keys from localStorage
   */
  clearAllApiKeys(): void {
    const apiKeyNames = [
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'GROQ_API_KEY',
      'DEEPSEEK_API_KEY',
      'GOOGLE_API_KEY',
      'FINANCIAL_DATASETS_API_KEY'
    ];

    apiKeyNames.forEach(name => {
      localStorage.removeItem(`api_key_${name}`);
    });
  }
};