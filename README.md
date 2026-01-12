# Agentic Debate Co-Creative AI

**A revolutionary human-AI collaborative design platform powered by multi-agent debate systems**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org/)
[![AutoGen](https://img.shields.io/badge/AutoGen-Multi--Agent-orange)](https://microsoft.github.io/autogen/)

---

## 🚀 Overview

<img width="1800" alt="image" src="https://github.com/user-attachments/assets/0b61291b-b40c-46e0-aee9-54401f29cda1" />



CoCreate is an **innovative AI-powered design platform** that revolutionizes the creative process by orchestrating multiple specialized AI agents that debate, critique, and collaboratively refine design decisions. Built on cutting-edge technologies like Microsoft AutoGen, Google Gemini, and Groq's ultra-fast inference, it offers designers an unprecedented level of AI assistance.

### ✨ Key Features

🤖 **Multi-Agent Debate System**  
Specialized AI agents (Strategy, UX, Visual, Accessibility) engage in structured debates to provide comprehensive design feedback

🎨 **AI-Powered Generation**  
Create stunning logos, illustrations, and designs using state-of-the-art models (Gemini Vision, Reve API, Llama 3.3 70B)

🖼️ **Interactive Canvas**  
Professional-grade canvas powered by Konva.js for real-time design manipulation and editing

💬 **Intelligent Chat Interface**  
Natural language interaction with context-aware AI that understands your design intent

📊 **Diagram Generation**  
Automatically generate UML, flowcharts, and architecture diagrams from text descriptions

🔍 **Expert Design Analysis**  
Get detailed UX/UI critiques using Gemini Vision API with actionable improvement suggestions

---

## 🏗️ System Architecture

### Technology Stack

#### Frontend Layer
```
React 18.2 + Vite
├── Konva.js - Interactive canvas manipulation
├── Lucide React - Icon library
└── Context API - State management with localStorage persistence
```

#### Backend Layer
```
Node.js + Express (Port 3001)
├── Reve API Integration - High-quality image generation
├── Gemini Vision - Advanced image analysis
├── Groq/Llama 3.3 70B - Ultra-fast intent detection
└── SQLite - Persistent data storage

Python + FastAPI (Port 8000)
├── Microsoft AutoGen - Multi-agent orchestration
├── SSE Streaming - Real-time debate updates
└── Specialized Agents - Strategy, UX, Visual, Accessibility
```

#### AI Models
- **Gemini 2.5 Flash** - Vision tasks and image understanding
- **Groq (Llama 3.3 70B)** - Lightning-fast text generation (~500ms response)
- **Reve API** - Professional-grade image generation
- **AutoGen Framework** - Collaborative multi-agent debates

---

## 📦 Installation

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) 18+
- [Python](https://python.org/) 3.11+
- [Git](https://git-scm.com/)

### 1️⃣ Clone Repository

```bash
git clone https://github.com/haf0g/agentic-debate-co-creative-ai.git
cd agentic-debate-co-creative-ai
```

### 2️⃣ Environment Configuration

Create `.env` file in project root:

```env
# API Keys
GEMINI_API_KEY=your_gemini_key_here
REVE_API_KEY=your_reve_key_here
GROQ_API_KEY=your_groq_key_here
HF_TOKEN=your_huggingface_token_here

# Configuration
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DEBATE_LLM_PROVIDER=groq
GROQ_MODEL=llama-3.3-70b-versatile
```

**Get Your API Keys:**
| Service | Link | Purpose |
|---------|------|---------|
| Gemini | [Google AI Studio](https://aistudio.google.com/app/apikey) | Image analysis |
| Reve | [Reve API](https://docs.reve.com) | Image generation |
| Groq | [Groq Console](https://console.groq.com/) | Fast LLM inference |
| Hugging Face | [HF Settings](https://huggingface.co/settings/tokens) | Optional models |

### 3️⃣ Install Dependencies

**Node.js packages:**
```bash
npm install
```

**Python packages:**
```bash
cd agents
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 4️⃣ Launch Application

**Option A - All services (Windows):**
```bash
start_all.bat
```

**Option B - Manual launch:**
```bash
# Terminal 1 - Frontend
npm run dev:client

# Terminal 2 - Backend API
npm run dev:server

# Terminal 3 - Debate Agents
cd agents && python main.py
```

### 5️⃣ Access Application

- **Frontend UI**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Debate API**: http://localhost:8000/docs

---

## 🎯 Core Features Explained

### 1. Multi-Agent Debate System

The debate system orchestrates **4 specialized AI agents** that collaborate through structured argumentation:

| Agent | Expertise | Focus Areas |
|-------|-----------|-------------|
| 🎯 **Strategy** | Business alignment | Target audience, brand positioning, market fit |
| 👤 **UX** | User experience | Accessibility, interaction patterns, usability |
| 🎨 **Visual** | Aesthetics | Color theory, typography, visual hierarchy |
| ♿ **Accessibility** | Inclusive design | WCAG compliance, readability, universal design |

**Debate Flow:**
```
User Input → Debate Launch → Agents Argue → Synthesis → Actionable Feedback
```

Real-time updates streamed via Server-Sent Events (SSE)

### 2. AI-Powered Design Generation

- **Text-to-Image**: Natural language → Professional designs
- **Style Transfer**: Apply artistic styles to existing designs
- **Image Editing**: AI-assisted modifications
- **Format Support**: PNG, SVG, JPEG

### 3. Intelligent Chat Interface

Features:
- ✅ Context-aware conversation history
- ✅ Image attachment support for analysis
- ✅ Automatic intent detection (generate/analyze/edit)
- ✅ Ultra-fast fallback to keyword detection when APIs are rate-limited

### 4. Design Analysis Engine

Upload designs to receive:
- Visual hierarchy assessment
- Color palette and typography evaluation
- Accessibility compliance check (WCAG standards)
- Prioritized improvement recommendations

### 5. Diagram Generation

Supports creation of:
- Flowcharts
- UML diagrams (Class, Sequence, Activity)
- System architecture diagrams
- Entity-relationship diagrams

---

## 📂 Project Structure

```
cocreate-app/
├── src/                          # React frontend
│   ├── components/               # UI components
│   │   ├── ChatInterface.jsx    # Main chat UI
│   │   ├── DebateInterface.jsx  # Multi-agent debate view
│   │   ├── ImageCanvas.jsx      # Konva canvas
│   │   └── ImageGallery.jsx     # Generated images
│   ├── context/
│   │   └── ProjectContext.jsx   # Global state management
│   ├── hooks/                    # Custom React hooks
│   └── styles/                   # CSS modules
│
├── server/                       # Express backend
│   ├── routes/
│   │   ├── agent.js             # Intent detection & orchestration
│   │   ├── designAnalysis.js    # Gemini Vision integration
│   │   ├── assetGeneration.js   # Reve API integration
│   │   ├── debate.js            # Debate system proxy
│   │   └── utils/
│   │       ├── geminiClient.js  # Gemini API wrapper
│   │       └── groqClient.js    # Groq API wrapper
│   ├── data/                    # SQLite database
│   └── index.js                 # Express server entry
│
├── agents/                       # Python debate system
│   ├── main.py                  # FastAPI server
│   ├── debate_manager.py        # Debate orchestration logic
│   ├── design_crew.py           # Agent definitions (AutoGen)
│   ├── config.py                # Configuration
│   └── requirements.txt         # Python dependencies
│
├── .env                          # Environment variables (git-ignored)
├── .gitignore                   # Git ignore patterns
├── package.json                 # Node.js dependencies
└── README.md                    # This file
```

---

## ⚙️ Configuration & Optimization

### Groq Integration (Recommended)

Groq provides **ultra-fast LLM inference**, bypassing Gemini's strict rate limits:

**Benefits:**
- ⚡ **10x faster** than Gemini (~500ms vs 5-10s)
- 🆓 **14,400 requests/day** free tier (vs Gemini's 20/day)
- 🔄 Automatic fallback when Gemini quota exceeded

Enable in `.env`:
```env
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
DEBATE_LLM_PROVIDER=groq
```

### Rate Limiting Configuration

Fine-tune API behavior:
```env
GEMINI_REQUESTS_PER_MINUTE=5
GEMINI_MAX_RETRIES=3
GEMINI_CACHE_TTL_MS=60000
```

### Database

SQLite stores:
- Project metadata
- Conversation history
- Generated images
- User preferences

Location: `server/data/cocreate.db`

---

## 🛠️ Development

### Build for Production

```bash
npm run build
```
Output: `dist/` folder

### Run Production Server

```bash
npm start
```

### Development Mode

```bash
npm run dev  # Runs both client and server with hot reload
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Gemini quota exceeded** | Switch to Groq or wait for daily reset |
| **GROQ_API_KEY not found** | Add key to `.env` file |
| **localStorage quota exceeded** | App auto-compresses images >50KB |
| **Port conflicts** | Change `PORT` in `.env` |
| **Python packages not found** | Activate venv: `source venv/bin/activate` |

### Debug Mode

Enable detailed logging:
```env
NODE_ENV=development
```

Check console for:
- `[DEBUG]` - General debugging
- `[GROQ]` - Groq API calls
- `[GEMINI]` - Gemini API interactions
- `[ANALYZE-BASE64]` - Image analysis

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** this repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Keep commits atomic and descriptive

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with these incredible technologies:

- [Microsoft AutoGen](https://microsoft.github.io/autogen/) - Multi-agent framework
- [Google Gemini](https://ai.google.dev/) - Vision and language models
- [Groq](https://groq.com/) - Ultra-fast LLM inference
- [Reve API](https://reve.com/) - Image generation
- [React](https://react.dev/) & [Vite](https://vitejs.dev/) - Modern frontend stack
- [FastAPI](https://fastapi.tiangolo.com/) - Python API framework

---

## 📞 Support & Community

- 🐛 **Report Issues**: [GitHub Issues](https://github.com/haf0g/agentic-debate-co-creative-ai/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/haf0g/agentic-debate-co-creative-ai/discussions)
- ⭐ **Star this repo** if you find it useful!

---

## 🗺️ Roadmap

Upcoming features:

- [ ] Real-time collaborative editing (multi-user)
- [ ] Custom agent plugins
- [ ] Advanced version control for designs
- [ ] Figma/Sketch export integration
- [ ] Mobile app (React Native)
- [ ] Team workspaces with permissions
- [ ] Design system integration

---

<div align="center">

**Made with ❤️ and AI**

[Report Bug](https://github.com/haf0g/agentic-debate-co-creative-ai/issues) • [Request Feature](https://github.com/haf0g/agentic-debate-co-creative-ai/issues) • [Documentation](https://github.com/haf0g/agentic-debate-co-creative-ai/wiki)

</div>
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
