import os
import random
import re
import threading
import time
from typing import Any, Callable, Optional


_PATCHED = False


def _env_float(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


class _GlobalRateGate:
    def __init__(self, min_interval_seconds: float):
        self._min_interval = max(0.0, float(min_interval_seconds))
        self._lock = threading.Lock()
        self._next_allowed = 0.0

    def wait_turn(self) -> None:
        if self._min_interval <= 0:
            return

        sleep_seconds = 0.0
        with self._lock:
            now = time.monotonic()
            if now < self._next_allowed:
                sleep_seconds = self._next_allowed - now
                self._next_allowed = self._next_allowed + self._min_interval
            else:
                self._next_allowed = now + self._min_interval

        if sleep_seconds > 0:
            if os.getenv("GEMINI_RATE_LIMIT_DEBUG", "0").lower() in {"1", "true", "yes"}:
                print(f"[gemini-rate-limit] sleeping {sleep_seconds:.2f}s to respect RPM")
            time.sleep(sleep_seconds)


def _is_rate_limit_error(err: BaseException) -> bool:
    msg = str(getattr(err, "message", "") or err).lower()
    return "429" in msg or "resource_exhausted" in msg or "quota exceeded" in msg


def _retry_after_seconds(err: BaseException) -> Optional[float]:
    # Try common OpenAI error attributes (openai>=1) first.
    resp = getattr(err, "response", None)
    headers = getattr(resp, "headers", None)
    if headers:
        ra = headers.get("retry-after") or headers.get("Retry-After")
        if ra:
            try:
                return float(ra)
            except ValueError:
                pass

    # Fallback to parsing message (Gemini often says "Please retry in Xs").
    msg = str(getattr(err, "message", "") or err)
    m = re.search(r"retry in\s+(\d+(?:\.\d+)?)s", msg, re.IGNORECASE)
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            return None

    return None


def patch_autogen_for_gemini_free_tier() -> None:
    """Patch AutoGen's OpenAI client to respect Gemini free-tier rate limits.

    AutoGen uses an OpenAI-compatible client for the configured `base_url`.
    This patch inserts a global wait before each LLM call and retries 429s.
    """

    global _PATCHED
    if _PATCHED:
        return

    # Default Gemini free tier: 5 requests/minute => 12s interval.
    debug = os.getenv("GEMINI_RATE_LIMIT_DEBUG", "0").lower() in {"1", "true", "yes"}

    rpm = _env_int("GEMINI_REQUESTS_PER_MINUTE", 5)
    min_interval = _env_float("GEMINI_MIN_INTERVAL_SECONDS", 60.0 / max(1, rpm))
    max_retries = _env_int("GEMINI_MAX_RETRIES", 3)

    gate = _GlobalRateGate(min_interval_seconds=min_interval)

    try:
        from autogen.oai.client import OpenAIClient  # type: ignore
        import openai  # type: ignore
    except Exception:
        # If autogen/openai are not available, nothing to patch.
        return

    original_create: Callable[..., Any] = OpenAIClient.create

    def patched_create(self: Any, params: dict[str, Any]):
        attempt = 0
        while True:
            gate.wait_turn()
            try:
                return original_create(self, params)
            except BaseException as e:
                attempt += 1
                is_rl = isinstance(e, getattr(openai, "RateLimitError", ())) or _is_rate_limit_error(e)
                if is_rl and attempt <= max_retries:
                    delay = _retry_after_seconds(e)
                    if delay is None:
                        delay = min_interval
                    if debug:
                        print(
                            f"[gemini-rate-limit] 429/rate-limit detected; retrying in {delay:.2f}s (attempt {attempt}/{max_retries})"
                        )
                    time.sleep(max(0.0, delay) + random.uniform(0.0, 0.25))
                    continue
                raise

    OpenAIClient.create = patched_create  # type: ignore[assignment]
    _PATCHED = True
