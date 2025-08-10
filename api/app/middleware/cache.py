"""
API响应缓存中间件

提供基于内存的缓存功能，优化API响应性能
"""

from functools import wraps
from typing import Dict, Any, Optional, Callable
from datetime import datetime, timedelta
import json
import hashlib
from fastapi import Request, Response


class APICache:
    """API缓存管理器"""
    
    def __init__(self, default_ttl: int = 300):
        """
        初始化缓存管理器
        
        Args:
            default_ttl: 默认缓存时间（秒）
        """
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl
        self._access_times: Dict[str, datetime] = {}
        self.max_cache_size = 1000  # 最大缓存条目数
    
    def _generate_key(self, request: Request, additional_params: Optional[Dict] = None) -> str:
        """生成缓存键"""
        # 基于URL、查询参数和额外参数生成唯一键
        base_string = f"{request.method}:{request.url}"
        
        if additional_params:
            base_string += f":{json.dumps(additional_params, sort_keys=True)}"
        
        return hashlib.md5(base_string.encode()).hexdigest()
    
    def _cleanup_expired(self):
        """清理过期的缓存条目"""
        now = datetime.now()
        expired_keys = []
        
        for key, cache_data in self._cache.items():
            if now > cache_data['expires_at']:
                expired_keys.append(key)
        
        for key in expired_keys:
            del self._cache[key]
            if key in self._access_times:
                del self._access_times[key]
    
    def _evict_lru(self):
        """使用LRU策略驱逐缓存"""
        if len(self._cache) >= self.max_cache_size:
            # 找到最近最少使用的键
            lru_key = min(self._access_times.items(), key=lambda x: x[1])[0]
            del self._cache[lru_key]
            del self._access_times[lru_key]
    
    def get(self, key: str) -> Optional[Any]:
        """获取缓存值"""
        self._cleanup_expired()
        
        if key in self._cache:
            cache_data = self._cache[key]
            if datetime.now() <= cache_data['expires_at']:
                self._access_times[key] = datetime.now()
                return cache_data['value']
            else:
                # 过期缓存
                del self._cache[key]
                if key in self._access_times:
                    del self._access_times[key]
        
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """设置缓存值"""
        self._cleanup_expired()
        self._evict_lru()
        
        expires_at = datetime.now() + timedelta(seconds=ttl or self.default_ttl)
        
        self._cache[key] = {
            'value': value,
            'expires_at': expires_at,
            'created_at': datetime.now()
        }
        self._access_times[key] = datetime.now()
    
    def delete(self, key: str) -> bool:
        """删除缓存值"""
        if key in self._cache:
            del self._cache[key]
            if key in self._access_times:
                del self._access_times[key]
            return True
        return False
    
    def clear(self) -> None:
        """清空所有缓存"""
        self._cache.clear()
        self._access_times.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        """获取缓存统计信息"""
        self._cleanup_expired()
        
        return {
            'total_entries': len(self._cache),
            'max_cache_size': self.max_cache_size,
            'default_ttl': self.default_ttl,
            'memory_usage_mb': len(str(self._cache)) / 1024 / 1024,  # 粗略估算
            'oldest_entry': min(
                (data['created_at'] for data in self._cache.values()), 
                default=None
            ),
            'newest_entry': max(
                (data['created_at'] for data in self._cache.values()), 
                default=None
            )
        }


# 全局缓存实例
api_cache = APICache(default_ttl=300)  # 默认5分钟缓存


def cache_response(ttl: int = 300, key_params: Optional[list] = None):
    """
    API响应缓存装饰器
    
    Args:
        ttl: 缓存时间（秒）
        key_params: 额外的键参数列表
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 尝试从kwargs中获取Request对象
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if not request:
                # 如果没有Request对象，直接执行函数
                return await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
            
            # 生成缓存键
            additional_params = {}
            if key_params:
                for param in key_params:
                    if param in kwargs:
                        additional_params[param] = kwargs[param]
            
            cache_key = api_cache._generate_key(request, additional_params)
            
            # 尝试从缓存获取
            cached_result = api_cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # 执行函数
            import asyncio
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            
            # 存储到缓存
            api_cache.set(cache_key, result, ttl)
            
            return result
        
        return wrapper
    return decorator


def invalidate_cache_pattern(pattern: str) -> int:
    """
    根据模式删除缓存
    
    Args:
        pattern: 匹配模式（简单的字符串包含匹配）
    
    Returns:
        删除的缓存条目数量
    """
    api_cache._cleanup_expired()
    
    keys_to_delete = []
    for key in api_cache._cache.keys():
        if pattern in key:
            keys_to_delete.append(key)
    
    for key in keys_to_delete:
        api_cache.delete(key)
    
    return len(keys_to_delete)


class CacheMiddleware:
    """缓存中间件类"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            # 在这里可以添加全局缓存逻辑
            # 目前主要通过装饰器处理缓存
            pass
        
        await self.app(scope, receive, send)