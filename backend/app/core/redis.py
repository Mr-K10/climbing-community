import redis
import os
import json
from typing import Optional, Any
from dotenv import load_dotenv

load_dotenv(override=True)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

class RedisCache:
    def __init__(self):
        try:
            self.redis = redis.from_url(REDIS_URL, decode_responses=True)
            self.redis.ping()
            print("Successfully connected to Redis.")
        except Exception as e:
            print(f"Redis connection failed: {e}")
            self.redis = None

    def get(self, key: str) -> Optional[Any]:
        if not self.redis:
            return None
        data = self.redis.get(key)
        if data:
            try:
                return json.loads(data)
            except json.JSONDecodeError:
                return data
        return None

    def set(self, key: str, value: Any, expire_seconds: int = 3600):
        if not self.redis:
            return
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        self.redis.set(key, value, ex=expire_seconds)

    def delete(self, key: str):
        if not self.redis:
            return
        self.redis.delete(key)

cache = RedisCache()
