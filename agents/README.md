# CoCreate Agentic - Python Backend

This directory contains the **Multi-Agent Design Debate System** built with Microsoft AutoGen.

## Architecture

```
agents/
├── main.py           # FastAPI server (entry point)
├── config.py         # Configuration & API keys
├── design_crew.py    # Agent definitions
├── debate_manager.py # Debate orchestration
└── requirements.txt  # Python dependencies
```

## Agents

| Agent | Role | Personality |
|-------|------|-------------|
| 🧠 **Orchestrator** | Moderates debate | Diplomatic, organized |
| 📝 **DesignCritic** | Evaluates designs | Analytical, thorough |
| 🎨 **DesignArtist** | Creates concepts | Creative, passionate |
| 📊 **UXResearcher** | User perspective | Data-driven, empathetic |
| 💡 **BrandStrategist** | Brand alignment | Strategic, visionary |

## Setup

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Run

```bash
python main.py
```

Server starts at: `http://127.0.0.1:8000`

## API Endpoints

- `POST /debate/start` - Start a new debate
- `GET /debate/status/{id}` - Get debate status
- `GET /debate/result/{id}` - Get full results
- `WS /debate/ws/{id}` - Real-time updates
