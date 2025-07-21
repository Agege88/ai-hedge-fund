import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useApiKeys } from '@/hooks/use-api-keys';
import { cn } from '@/lib/utils';
import { CheckCircle, Eye, EyeOff, Key, Loader2, Save, TestTube, XCircle } from 'lucide-react';
import { useState } from 'react';

export function ApiKeysSettings() {
  const { 
    apiKeys, 
    loading, 
    testing, 
    saveApiKey, 
    testApiKey, 
    saveAllApiKeys, 
    updateApiKey 
  } = useApiKeys();
  
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

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

  const getValidationIcon = (name: string) => {
    const apiKey = apiKeys[name];
    if (!apiKey) return null;
    
    if (testing.has(name)) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    if (apiKey.isValid === true) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (apiKey.isValid === false) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-primary mb-2">API Keys</h2>
          <p className="text-sm text-muted-foreground">
            Loading API key configuration...
          </p>
        </div>
        <Card className="bg-panel border-gray-700 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <CardContent className="p-6">
          <div className="space-y-6">
            {Object.entries(apiKeys).map(([name, config], index) => (
              <div key={name}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor={name} className="text-sm font-medium text-primary">
                        {name}
                        {config.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {name.split('_')[0]} API key for {name.includes('FINANCIAL') ? 'market data' : 'language models'}
                      </p>
                    </div>
                    {getValidationIcon(name)}
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id={name}
                        type={visibleKeys.has(name) ? 'text' : 'password'}
                        value={config.value}
                        onChange={(e) => updateApiKey(name, e.target.value)}
                        placeholder={`Enter your ${name.split('_')[0]} API key`}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => toggleKeyVisibility(name)}
                      >
                        {visibleKeys.has(name) ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => saveApiKey(name, config.value)}
                      disabled={!config.value.trim()}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testApiKey(name)}
                      disabled={!config.value.trim() || testing.has(name)}
                      className={cn(
                        "flex items-center gap-2",
                        config.isValid === true && "border-green-500 text-green-500",
                        config.isValid === false && "border-red-500 text-red-500"
                      )}
                    >
                      <TestTube className="h-4 w-4" />
                      {testing.has(name) ? 'Testing...' : 'Test'}
                    </Button>
                  </div>
                </div>

                {index < Object.keys(apiKeys).length - 1 && <Separator className="mt-6" />}
              </div>
            ))}

            <div className="pt-4 border-t">
              <Button onClick={saveAllApiKeys} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save All API Keys
              </Button>
            </div>
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