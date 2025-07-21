from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from typing import Dict, Any
import asyncio

router = APIRouter(prefix="/api", tags=["api-keys"])

class TestApiKeyRequest(BaseModel):
    provider: str
    apiKey: str
    testEndpoint: str

class TestApiKeyResponse(BaseModel):
    success: bool
    message: str
    details: Dict[str, Any] = {}

@router.post("/test-api-key", response_model=TestApiKeyResponse)
async def test_api_key(request: TestApiKeyRequest):
    """Test if an API key is valid by making a simple request to the provider."""
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {}
            
            # Set up headers based on provider
            if request.provider == "openai":
                headers = {
                    "Authorization": f"Bearer {request.apiKey}",
                    "Content-Type": "application/json"
                }
                # Test with a simple models list request
                response = await client.get(
                    "https://api.openai.com/v1/models",
                    headers=headers
                )
                
            elif request.provider == "anthropic":
                headers = {
                    "x-api-key": request.apiKey,
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01"
                }
                # Test with a simple request
                test_data = {
                    "model": "claude-3-haiku-20240307",
                    "max_tokens": 1,
                    "messages": [{"role": "user", "content": "Hi"}]
                }
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers=headers,
                    json=test_data
                )
                
            elif request.provider == "groq":
                headers = {
                    "Authorization": f"Bearer {request.apiKey}",
                    "Content-Type": "application/json"
                }
                response = await client.get(
                    "https://api.groq.com/openai/v1/models",
                    headers=headers
                )
                
            elif request.provider == "deepseek":
                headers = {
                    "Authorization": f"Bearer {request.apiKey}",
                    "Content-Type": "application/json"
                }
                response = await client.get(
                    "https://api.deepseek.com/v1/models",
                    headers=headers
                )
                
            elif request.provider == "google":
                # Google AI uses API key as query parameter
                response = await client.get(
                    f"https://generativelanguage.googleapis.com/v1beta/models?key={request.apiKey}"
                )
                
            elif request.provider == "financial":
                headers = {
                    "X-API-KEY": request.apiKey
                }
                # Test with a simple company facts request
                response = await client.get(
                    "https://api.financialdatasets.ai/company/facts/?ticker=AAPL",
                    headers=headers
                )
                
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported provider: {request.provider}")
            
            # Check response status
            if response.status_code == 200:
                return TestApiKeyResponse(
                    success=True,
                    message=f"{request.provider.title()} API key is valid",
                    details={"status_code": response.status_code}
                )
            elif response.status_code == 401:
                return TestApiKeyResponse(
                    success=False,
                    message=f"Invalid API key for {request.provider}",
                    details={"status_code": response.status_code, "error": "Unauthorized"}
                )
            elif response.status_code == 403:
                return TestApiKeyResponse(
                    success=False,
                    message=f"API key lacks required permissions for {request.provider}",
                    details={"status_code": response.status_code, "error": "Forbidden"}
                )
            else:
                return TestApiKeyResponse(
                    success=False,
                    message=f"API test failed for {request.provider}",
                    details={"status_code": response.status_code, "error": response.text}
                )
                
    except httpx.TimeoutException:
        return TestApiKeyResponse(
            success=False,
            message=f"Timeout testing {request.provider} API key",
            details={"error": "Request timeout"}
        )
    except httpx.RequestError as e:
        return TestApiKeyResponse(
            success=False,
            message=f"Network error testing {request.provider} API key",
            details={"error": str(e)}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Unexpected error testing API key: {str(e)}"
        )

@router.get("/api-key-status")
async def get_api_key_status():
    """Get the status of required API keys (without exposing the actual keys)."""
    
    # This would typically check environment variables or a secure store
    # For now, we'll return a simple status
    return {
        "openai": {"configured": bool(os.getenv("OPENAI_API_KEY")), "required": True},
        "anthropic": {"configured": bool(os.getenv("ANTHROPIC_API_KEY")), "required": False},
        "groq": {"configured": bool(os.getenv("GROQ_API_KEY")), "required": False},
        "deepseek": {"configured": bool(os.getenv("DEEPSEEK_API_KEY")), "required": False},
        "google": {"configured": bool(os.getenv("GOOGLE_API_KEY")), "required": False},
        "financial": {"configured": bool(os.getenv("FINANCIAL_DATASETS_API_KEY")), "required": False},
    }