#  Agentic Debate Co-Creative AI

> A collaborative human-AI design platform powered by multi-agent debate and advanced generative AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org/)

##  Overview

**CoCreate AI Design App** is an innovative platform that combines human creativity with AI-powered design assistance through a multi-agent debate system. The application enables designers and teams to:

-  **Multi-Agent Debate**: Leverage AI agents with specialized design expertise that debate and critique design decisions
-  **AI-Powered Design Generation**: Create logos, illustrations, and designs using advanced AI models (Gemini, Reve, Groq)
-  **Interactive Canvas**: Edit and refine designs on an intuitive canvas with real-time collaboration
-  **Intelligent Chat Interface**: Natural language interaction with context-aware AI assistance
-  **Diagram Generation**: Automatically generate UML, flowcharts, and architecture diagrams
-  **Design Analysis**: Get expert UX/UI feedback using Gemini Vision API

##  Architecture

### Frontend
- **Framework**: React 18.2 with Vite
- **UI Libraries**: Konva (canvas), Lucide React (icons)
- **State Management**: React Context API with localStorage persistence

### Backend
- **Node.js/Express**: Main API server (port 3001)
  - Image generation via Reve API
  - Design analysis via Gemini Vision
  - Intent detection via Groq (Llama 3.3 70B)
  - SQLite database for persistence
  
- **Python/FastAPI**: Multi-agent debate system (port 8000)
  - AutoGen framework for agent orchestration
  - Real-time SSE streaming
  - Specialized design agents (Strategy, UX, Visual, Accessibility)

### AI Models
- **Gemini 2.5 Flash**: Image analysis and vision tasks
- **Groq (Llama 3.3 70B)**: Fast intent detection and text generation
- **Reve API**: High-quality image generation and editing
- **AutoGen**: Multi-agent debate orchestration

##  Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://python.org/))
- **Git** ([Download](https://git-scm.com/))

### 1. Clone the Repository

\\ash
git clone https://github.com/haf0g/agentic-debate-co-creative-ai.git
cd agentic-debate-co-creative-ai
\
### 2. Configure Environment Variables

Create a \.env\ file at the root:

\\env
# Google Generative AI (Gemini)
GEMINI_API_KEY=your_gemini_api_key_here

# Reve API (Image Generation)
REVE_API_KEY=your_reve_api_key_here

# Groq API (Fast LLM)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Hugging Face (Optional)
HF_TOKEN=your_huggingface_token_here

# Server Configuration
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Debate System
DEBATE_LLM_PROVIDER=groq
\
**Get API Keys:**
- **Gemini**: [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Reve**: [Reve API Docs](https://docs.reve.com)
- **Groq**: [Groq Console](https://console.groq.com/)
- **Hugging Face**: [HF Settings](https://huggingface.co/settings/tokens)

### 3. Install Dependencies

#### Node.js (Frontend + Backend)
\\ash
npm install
\
#### Python (Debate Agents)
\\ash
cd agents

# Windows
python -m venv cocreatevenv
cocreatevenv\Scripts\activate
pip install -r requirements.txt

# Linux/macOS/WSL
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
\
### 4. Start the Application

#### Option A: All Services (Windows)
\\ash
start_all.bat
\
#### Option B: Manual Start
\\ash
# Terminal 1: Frontend (Vite)
npm run dev:client

# Terminal 2: Backend (Express)
npm run dev:server

# Terminal 3: Debate Agents (FastAPI)
cd agents
python main.py
\
### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Debate API**: http://localhost:8000

##  Key Features

### 1. Multi-Agent Debate System

The debate system orchestrates specialized AI agents that collaborate to provide comprehensive design feedback:

- ** Strategy Agent**: Business alignment, target audience, brand positioning
- ** UX Agent**: User experience, accessibility, interaction patterns
- ** Visual Agent**: Aesthetics, color theory, typography, visual hierarchy
- ** Accessibility Agent**: WCAG compliance, inclusive design, usability

**How it works:**
1. User submits a design prompt or image
2. Agents debate the design from their specialized perspectives
3. System synthesizes insights into actionable recommendations
4. Real-time streaming updates via Server-Sent Events (SSE)

### 2. AI-Powered Design Generation

- **Text-to-Image**: Generate designs from natural language descriptions
- **Image Editing**: Modify existing designs with AI assistance
- **Style Transfer**: Apply artistic styles to designs
- **Multiple Formats**: PNG, SVG, JPEG support

### 3. Intelligent Chat Interface

- **Context-Aware**: Remembers conversation history and project context
- **Image Attachments**: Analyze designs within chat
- **Intent Detection**: Automatically routes requests to appropriate AI services
- **Keyword Fallback**: Ultra-fast intent detection when API limits reached

### 4. Design Analysis

Upload designs for expert UX/UI critique:
- Visual hierarchy assessment
- Color and typography consistency
- Accessibility evaluation
- Actionable improvement suggestions

### 5. Diagram Generation

Generate professional diagrams from descriptions:
- Flowcharts
- UML diagrams
- Architecture diagrams
- Entity-relationship diagrams

##  Configuration

### Groq Integration (Recommended)

Groq provides ultra-fast inference for intent detection, bypassing Gemini rate limits:

\\env
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
\
**Benefits:**
-  10x faster than Gemini (~500ms vs 5-10s)
-  Generous free tier (~14,400 req/day vs Gemini'\''s 20/day)
-  Automatic fallback when Gemini hits quota

See [GROQ_INTEGRATION.md](GROQ_INTEGRATION.md) for details.

##  Project Structure

\cocreate-app/
 src/                      # React frontend
    components/           # UI components
    context/             # State management
    hooks/               # Custom hooks
    styles/              # CSS stylesheets
 server/                   # Express backend
    routes/              # API endpoints
       agent.js         # Agent orchestration
       designAnalysis.js # Gemini Vision analysis
       assetGeneration.js # Reve image generation
       utils/           # Utility modules
    data/                # SQLite database
 agents/                   # Python debate system
    main.py              # FastAPI server
    debate_manager.py    # Debate orchestration
    design_crew.py       # Agent definitions
    config.py            # Configuration
 uploads/                  # Temporary file storage
 .env                     # Environment variables (git-ignored)
\
##  Development

### Build for Production

\\ash
npm run build
\
### Run Production Server

\\ash
npm start
\
##  Documentation

- [Quick Start Guide](QUICKSTART.md)
- [Technical Documentation](TECHNICAL_DOCS.md)
- [Groq Integration](GROQ_INTEGRATION.md)
- [User Guide](GUIDE_UTILISATEUR.md)
- [Troubleshooting](TROUBLESHOOTING_DEBATE.md)

##  Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (\git checkout -b feature/amazing-feature\)
3. Commit your changes (\git commit -m '\''Add amazing feature'\''\)
4. Push to the branch (\git push origin feature/amazing-feature\)
5. Open a Pull Request

##  License

This project is licensed under the MIT License.

##  Acknowledgments

- **AutoGen** - Microsoft'\''s multi-agent framework
- **Google Gemini** - Vision and language models
- **Groq** - Ultra-fast LLM inference
- **Reve API** - High-quality image generation
- **React & Vite** - Modern frontend development

##  Support

- **Issues**: [GitHub Issues](https://github.com/haf0g/agentic-debate-co-creative-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/haf0g/agentic-debate-co-creative-ai/discussions)

---

**Made with  by the CoCreate Team**

 Star this repo if you find it useful!
