"""Shared asyncio semaphore to cap concurrent heavy conversions on 512 MB hosts."""

import asyncio

_conversion_semaphore: asyncio.Semaphore | None = None
_semaphore_limit: int | None = None


def get_conversion_semaphore(limit: int) -> asyncio.Semaphore:
    """Return an asyncio.Semaphore limiting concurrent backend conversions."""
    global _conversion_semaphore, _semaphore_limit
    safe_limit = max(1, limit)
    if _conversion_semaphore is None or _semaphore_limit != safe_limit:
        _conversion_semaphore = asyncio.Semaphore(safe_limit)
        _semaphore_limit = safe_limit
    return _conversion_semaphore
