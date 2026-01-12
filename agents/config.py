"""AutoGen Configuration for CoCreate Design Debate System.

This file configures the LLM provider used by the *debate agents only*.
Other providers (Reve, HF, etc.) are handled elsewhere and should not be affected.
"""
import os
from dotenv import load_dotenv
from pathlib import Path

try:
    # When running `python agents/main.py` (cwd=agents)
    from gemini_rate_limiter import patch_autogen_for_gemini_free_tier
except ModuleNotFoundError:
    # When importing as a package: `import agents.config`
    from agents.gemini_rate_limiter import patch_autogen_for_gemini_free_tier

# Load environment variables from parent directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

DEBATE_LLM_PROVIDER = os.getenv("DEBATE_LLM_PROVIDER", "gemini").strip().lower()

# Model selection
# - DEBATE_MODEL overrides everything (single knob)
# - Otherwise use provider-specific env vars
_default_model = "openai/gpt-oss-120b" if DEBATE_LLM_PROVIDER == "groq" else "gemini-2.5-flash"
if os.getenv("DEBATE_MODEL"):
    DEBATE_MODEL = os.getenv("DEBATE_MODEL", _default_model).strip()
elif DEBATE_LLM_PROVIDER == "groq":
    DEBATE_MODEL = os.getenv("GROQ_MODEL", _default_model).strip()
else:
    DEBATE_MODEL = os.getenv("GEMINI_MODEL", _default_model).strip()

# Feature flag: safer defaults for the Gemini free tier.
GEMINI_FREE_TIER_MODE = (
    DEBATE_LLM_PROVIDER == "gemini"
    and os.getenv("GEMINI_FREE_TIER_MODE", "1").lower() in {"1", "true", "yes"}
)

# Compact context mode: reduces prompt size and avoids accumulating long histories.
# Enabled by default for Groq (TPM constraints) and for Gemini free-tier mode.
DEBATE_COMPACT_CONTEXT = os.getenv(
    "DEBATE_COMPACT_CONTEXT",
    "1" if (DEBATE_LLM_PROVIDER == "groq" or GEMINI_FREE_TIER_MODE) else "0",
).lower() in {"1", "true", "yes"}

# Character budgets (cheap proxy for token limits).
# These are used to trim user prompts and summaries to keep each request under provider limits.
DEBATE_MAX_USER_PROMPT_CHARS = int(
    os.getenv("DEBATE_MAX_USER_PROMPT_CHARS", "1500" if DEBATE_COMPACT_CONTEXT else "6000")
)
DEBATE_MAX_SUMMARY_CHARS = int(
    os.getenv("DEBATE_MAX_SUMMARY_CHARS", "900" if DEBATE_COMPACT_CONTEXT else "2500")
)
DEBATE_MAX_AGENT_MESSAGE_CHARS = int(
    os.getenv("DEBATE_MAX_AGENT_MESSAGE_CHARS", "1200" if DEBATE_COMPACT_CONTEXT else "4000")
)

if DEBATE_LLM_PROVIDER == "gemini":
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not found in environment variables")

    # Apply a global rate limiter to avoid Gemini free-tier 429 bursts.
    # Safe to call multiple times.
    patch_autogen_for_gemini_free_tier()

    LLM_CONFIG = {
        "config_list": [
            {
                "model": DEBATE_MODEL,
                "api_key": GEMINI_API_KEY,
                "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
            }
        ],
        "temperature": 0.7,
        "timeout": 120,
        "cache_seed": None,  # Disable caching for varied responses
    }

elif DEBATE_LLM_PROVIDER == "groq":
    # Groq Cloud (OpenAI-compatible endpoint). Model example: openai/gpt-oss-120b
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not found in environment variables")

    LLM_CONFIG = {
        "config_list": [
            {
                "model": DEBATE_MODEL,
                "api_key": GROQ_API_KEY,
                "base_url": "https://api.groq.com/openai/v1",
            }
        ],
        # Keep defaults close to your Groq snippet, but compatible with AutoGen/OpenAI-style params.
        "temperature": float(os.getenv("DEBATE_TEMPERATURE", "1")),
        "timeout": int(os.getenv("DEBATE_TIMEOUT", "120")),
        "cache_seed": None,
    }

else:
    raise ValueError(f"Unsupported DEBATE_LLM_PROVIDER: {DEBATE_LLM_PROVIDER}. Use 'gemini' or 'groq'.")

# Agent-specific configurations
CRITIC_CONFIG = {
    **LLM_CONFIG,
    "temperature": 0.3  # More analytical, less creative
}

ARTIST_CONFIG = {
    **LLM_CONFIG,
    "temperature": 0.9  # More creative
}

UX_CONFIG = {
    **LLM_CONFIG,
    "temperature": 0.5  # Balanced
}

BRAND_CONFIG = {
    **LLM_CONFIG,
    "temperature": 0.6  # Strategic thinking
}

ORCHESTRATOR_CONFIG = {
    **LLM_CONFIG,
    "temperature": 0.4  # Organized, diplomatic
}

# Debate settings
DEBATE_SETTINGS = {
    "max_rounds": 4,
    "max_messages_per_round": 10,
    "consensus_threshold": 0.7,  # 70% agreement for consensus
    "timeout_per_round": 60  # seconds
}

if GEMINI_FREE_TIER_MODE:
    # Keep the debate usable under a 5 req/min cap (will still be slower, but avoids bursts).
    # You can override these in env vars if desired.
    DEBATE_SETTINGS["max_messages_per_round"] = int(os.getenv("DEBATE_MAX_MESSAGES_PER_ROUND", "3"))
    DEBATE_SETTINGS["max_rounds"] = int(os.getenv("DEBATE_MAX_ROUNDS", "3"))

if DEBATE_COMPACT_CONTEXT:
    # Groq/OpenAI-compatible providers may reject very large prompts under TPM limits.
    # This caps the number of turns per round to keep context small.
    DEBATE_SETTINGS["max_messages_per_round"] = int(os.getenv("DEBATE_MAX_MESSAGES_PER_ROUND", "4"))

# Speaker selection method: 'auto' costs extra LLM calls on some backends.
DEBATE_SPEAKER_SELECTION_METHOD = os.getenv(
    "DEBATE_SPEAKER_SELECTION_METHOD",
    "round_robin" if (GEMINI_FREE_TIER_MODE or DEBATE_COMPACT_CONTEXT) else "auto",
)

# Server settings (override via env for easier local testing)
# Examples:
#   - set AGENTS_PORT=8001
#   - set AGENTS_HOST=0.0.0.0
SERVER_HOST = os.getenv("AGENTS_HOST", os.getenv("SERVER_HOST", "127.0.0.1"))
SERVER_PORT = int(os.getenv("AGENTS_PORT", os.getenv("SERVER_PORT", "8000")))
