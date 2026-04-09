import os
import json
import redis
from google import genai
from typing import List, Tuple, Optional
from app.core.redis import cache

# Quota failure types
QUOTA_ERROR_TYPES = ["429", "RESOURCE_EXHAUSTED", "quota"]

class LLMManager:
    # Quota timeout for failures (in seconds)
    # Default is 10 minutes if we hit a quota error
    QUOTA_TIMEOUT = 600

    QUESTION_MODELS = [
        'gemini-2.5-flash',
        'gemini-3-flash-preview',
        'gemini-3.1-flash-lite-preview',
        'gemini-2.5-flash-lite'
    ]
    
    IMAGE_MODELS = [
        'imagen-4.0-fast-generate-001',
        'gemini-2.5-flash-image',
        'gemini-3.1-flash-image-preview',
        'gemini-3-pro-image-preview'
    ]


    def __init__(self):
        self.api_keys = [
            os.getenv("GOOGLE_API_KEY"),
            os.getenv("GOOGLE_API_KEY_FALLBACK_1")
        ]
        # Filter valid keys
        self.api_keys = [k for k in self.api_keys if k and "your_" not in k]
        
        # Mapping of api_key -> client
        self.clients = {key: genai.Client(api_key=key) for key in self.api_keys}
        if self.clients:
            first_key = list(self.clients.keys())[0]
            models_obj = self.clients[first_key].models
            print(f"DEBUG: LLMManager initialized. Models attributes: {dir(models_obj)}")

    def _get_quota_key(self, api_key: str, model: str) -> str:
        # Use a short hash of the API key for privacy/security while tracking
        key_hash = api_key[-6:] if len(api_key) > 6 else api_key
        return f"llm_quota_fail:{key_hash}:{model}"

    def report_quota_failure(self, api_key: str, model: str):
        """Mark a specific key/model as out of quota."""
        q_key = self._get_quota_key(api_key, model)
        # Store failure with expiration
        print(f"Reporting quota failure for {model} using key ending in {api_key[-4:]}. Disabling for {self.QUOTA_TIMEOUT}s.")
        cache.set(q_key, "out_of_quota", expire_seconds=self.QUOTA_TIMEOUT)

    def is_available(self, api_key: str, model: str) -> bool:
        """Check if this key/model combination is available."""
        q_key = self._get_quota_key(api_key, model)
        return cache.get(q_key) is None

    def get_best_client(self, model_type: str = "question") -> Tuple[Optional[genai.Client], Optional[str], Optional[str]]:
        """
        Returns (client, model_name, api_key) for the first available pair.
        Cycles through models first, then API keys.
        """
        models = self.QUESTION_MODELS if model_type == "question" else self.IMAGE_MODELS
        
        # User constraint: Only use GOOGLE_API_KEY_FALLBACK_1 for image generation
        if model_type == "image":
            fallback_key = os.getenv("GOOGLE_API_KEY_FALLBACK_1")
            relevant_keys = [fallback_key] if fallback_key and "your_" not in fallback_key else []
        else:
            relevant_keys = self.api_keys
            
        for model in models:
            for api_key in relevant_keys:
                if self.is_available(api_key, model):
                    client = self.clients.get(api_key)
                    if client:
                        return client, model, api_key
        
        # If everything is exhausted, return the first one as absolute fallback 
        if relevant_keys and models:
            first_key = relevant_keys[0]
            return self.clients.get(first_key), models[0], first_key
            
        return None, None, None

llm_manager = LLMManager()
