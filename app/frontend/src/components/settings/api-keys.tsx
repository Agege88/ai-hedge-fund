import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToastManager } from '@/hooks/use-toast-manager';
import { Eye, EyeOff, Key, Save, TestTube } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ApiKey {
  name: string;
  key: string;
  description: string;
  required: boolean;
  testEndpoint?: string;
}

const API_KEYS: ApiKey[] = [
  {
    name: 'OPENAI_API_KEY',
    key: '',
    description: 'OpenAI API key for GPT models',
    required: true,
    testEndpoint: 'https://api.openai.com/v1/models'
  },
  {
    name: 'ANTHROPIC_API_KEY',
    key: '',
    description: 'Anthropic API key for Claude models',
    required: false,
    testEndpoint: 'https://api.anthropic.com/v1/messages'
  },
  {
    name: 'GROQ_API_KEY',
    key: '',
    description: 'Groq API key for fast inference',
    required: false,
    testEndpoint: 'https://api.groq.com/openai/v1/models'
  },
  {
    name: 'DEEPSEEK_API_KEY',
    key: '',
    description: 'DeepSeek API key for reasoning models',
    required: false,
    testEndpoint: 'https://api.deepseek.com/v1/models'
  },
  {
    name: 'GOOGLE_API_KEY',
    key: '',
    description: 'Google API key for Gemini models',
    required: false,
    testEndpoint: 'https://generativelanguage.googleapis.com/v1/models'
  },
  {
    name: 'FINANCIAL_DATASETS_API_KEY',
    key: '',
    description: 'Financial Datasets API key for market data',
    required: false,
    testEndpoint: 'https://api.financialdatasets.ai/company/facts'
  }
];

export function ApiKeysSettings() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(API_KEYS);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [testingKeys, setTestingKeys] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({});
  const { success, error } = useToastManager();

  // Load API keys from localStorage on mount
  useEffect(() => {
    const savedKeys = { ...apiKeys };
    savedKeys.forEach(apiKey => {
      const savedValue = localStorage.getItem(`api_key_${apiKey.name}`);
      if (savedValue) {
        apiKey.key = savedValue;
      }
    });
    setApiKeys(savedKeys);
  }, []);

  const handleKeyChange = (name: string, value: string) => {
    setApiKeys(prev => prev.map(key => 
      key.name === name ? { ...key, key: value } : key
    ));
    // Clear test result when key changes
    setTestResults(prev => ({ ...prev, [name]: null }));
  };

  const toggleKeyVisibility = (name: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  };

  const saveApiKey = (name: string, value: string) => {
    try {
      if (value.trim()) {
        localStorage.setItem(`api_key_${name}`, value.trim());
        success(`${name} saved successfully`);
      } else {
        localStorage.removeItem(`api_key_${name}`);
        success(`${name} removed`);
      }
    } catch (err) {
      error(`Failed to save ${name}`);
    }
  };

  const saveAllKeys = () => {
    try {
      apiKeys.forEach(apiKey => {
        if (apiKey.key.trim()) {
          localStorage.setItem(`api_key_${apiKey.name}`, apiKey.key.trim());
        } else {
          localStorage.removeItem(`api_key_${apiKey.name}`);
        }
      });
      success('All API keys saved successfully');
    } catch (err) {
      error('Failed to save API keys');
    }
  };

  const testApiKey = async (apiKey: ApiKey) => {
    if (!apiKey.key.trim() || !apiKey.testEndpoint) {
      error(`Cannot test ${apiKey.name}: No API key or test endpoint`);
      return;
    }

    setTestingKeys(prev => new Set(prev).add(apiKey.name));
    setTestResults(prev => ({ ...prev, [apiKey.name]: null }));

    try {
      // Test the API key by making a simple request
      const response = await fetch('/api/test-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: apiKey.name.split('_')[0].toLowerCase(),
          apiKey: apiKey.key.trim(),
          testEndpoint: apiKey.testEndpoint
        })
      });

      if (response.ok) {
        setTestResults(prev => ({ ...prev, [apiKey.name]: 'success' }));
        success(`${apiKey.name} is valid`);
      } else {
        setTestResults(prev => ({ ...prev, [apiKey.name]: 'error' }));
        error(`${apiKey.name} test failed`);
      }
    } catch (err) {
      setTestResults(prev => ({ ...prev, [apiKey.name]: 'error' }));
      error(`Failed to test ${apiKey.name}`);
    } finally {
      setTestingKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(apiKey.name);
        return newSet;
      });
    }
  };

  const getTestResultIcon = (name: string) => {
    const result = testResults[name];
    if (result === 'success') {
      return <div className="w-2 h-2 bg-green-500 rounded-full" />;
    } else if (result === 'error') {
      return <div className="w-2 h-2 bg-red-500 rounded-full" />;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary mb-2">API Keys</h2>
        <p className="text-sm text-muted-foreground">
          Configure API keys for language models and financial data providers. 
          Keys are stored locally in your browser and never sent to our servers.
        </p>
      </div>

      <Card className="bg-panel border-gray-700 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-primary flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {apiKeys.map((apiKey, index) => (
            <div key={apiKey.name}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={apiKey.name} className="text-sm font-medium text-primary">
                      {apiKey.name}
                      {apiKey.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {apiKey.description}
                    </p>
                  </div>
                  {getTestResultIcon(apiKey.name)}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={apiKey.name}
                      type={visibleKeys.has(apiKey.name) ? 'text' : 'password'}
                      value={apiKey.key}
                      onChange={(e) => handleKeyChange(apiKey.name, e.target.value)}
                      placeholder={`Enter your ${apiKey.name.split('_')[0]} API key`}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => toggleKeyVisibility(apiKey.name)}
                    >
                      {visibleKeys.has(apiKey.name) ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => saveApiKey(apiKey.name, apiKey.key)}
                    disabled={!apiKey.key.trim()}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </Button>

                  {apiKey.testEndpoint && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testApiKey(apiKey)}
                      disabled={!apiKey.key.trim() || testingKeys.has(apiKey.name)}
                      className="flex items-center gap-2"
                    >
                      <TestTube className="h-4 w-4" />
                      {testingKeys.has(apiKey.name) ? 'Testing...' : 'Test'}
                    </Button>
                  )}
                </div>
              </div>

              {index < apiKeys.length - 1 && <Separator className="mt-6" />}
            </div>
          ))}

          <div className="pt-4 border-t">
            <Button onClick={saveAllKeys} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save All API Keys
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-panel border-gray-700 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-primary">
            Getting API Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-primary">Language Model Providers</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>OpenAI:</span>
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Get API Key
                  </a>
                </div>
                <div className="flex justify-between">
                  <span>Anthropic:</span>
                  <a 
                    href="https://console.anthropic.com/account/keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Get API Key
                  </a>
                </div>
                <div className="flex justify-between">
                  <span>Groq:</span>
                  <a 
                    href="https://console.groq.com/keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Get API Key
                  </a>
                </div>
                <div className="flex justify-between">
                  <span>Google AI:</span>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Get API Key
                  </a>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-primary">Data Providers</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Financial Datasets:</span>
                  <a 
                    href="https://financialdatasets.ai/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Get API Key
                  </a>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}