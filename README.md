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

**Made with  by the CoCreate Team**
Hafid GARHOUM & Oussama BADDI

**Supervised by**
Prof. Hamid Hrimech

## 📄 License
This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

Star this repo if you find it useful!
