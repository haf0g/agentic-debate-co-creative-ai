import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import fs from 'fs';

// Load .env before importing route modules (they read process.env at module load time)
dotenv.config();

// Debug (safe): confirm env keys are loaded
console.log('[env] GEMINI_API_KEY loaded:', Boolean(process.env.GEMINI_API_KEY));
console.log('[env] REVE_API_KEY loaded:', Boolean(process.env.REVE_API_KEY));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Import routes after dotenv is configured
const { default: agentRoutes } = await import('./routes/agent.js');
const { default: designAnalysisRoutes } = await import('./routes/designAnalysis.js');
const { default: assetGenerationRoutes } = await import('./routes/assetGeneration.js');
const { default: imageEditingRoutes } = await import('./routes/imageEditing.js');
const { default: diagramGenerationRoutes } = await import('./routes/diagramGeneration.js');

// Ensure data directory exists for SQLite
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Python AutoGen backend configuration
const PYTHON_BACKEND = {
  host: '127.0.0.1',
  port: 8000
};

// Configuration CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', process.env.CLIENT_URL].filter(Boolean),
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Proxy helper function for AutoGen backend
const proxyToAutoGen = (req, res, targetPath, method = 'GET') => {
  const bodyData = (method === 'POST' && req.body) ? JSON.stringify(req.body) : null;

  const options = {
    hostname: PYTHON_BACKEND.host,
    port: PYTHON_BACKEND.port,
    path: targetPath,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      ...(bodyData && { 'Content-Length': Buffer.byteLength(bodyData) })
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode);
    Object.entries(proxyRes.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (error) => {
    console.error('AutoGen backend error:', error.message);
    res.status(503).json({
      error: 'AutoGen backend unavailable',
      message: 'Start the Python server: cd agents && python main.py',
      details: error.message
    });
  });

  if (bodyData) {
    proxyReq.write(bodyData);
  }
  proxyReq.end();
};

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'CoCreate AI Design Server is running',
    features: ['agent', 'design-analysis', 'asset-generation', 'image-editing', 'diagram-generation', 'multi-agent-debate'],
    timestamp: new Date().toISOString()
  });
});

// ============================================
// API ROUTES
// ============================================

// Agent routes
app.use('/api/agent', agentRoutes);

// Design Analysis routes
app.use('/api/design-analysis', designAnalysisRoutes);

// Asset Generation routes
app.use('/api/asset-generation', assetGenerationRoutes);

// Image Editing routes
app.use('/api/image-editing', imageEditingRoutes);

// Diagram Generation routes
app.use('/api/diagram-generation', diagramGenerationRoutes);

// ============================================
// DEBATE API ROUTES (Proxy to Python AutoGen)
// ============================================

// Check AutoGen backend health
app.get('/api/debate/health', (req, res) => {
  proxyToAutoGen(req, res, '/health');
});

// Get agent information
app.get('/api/debate/agents', (req, res) => {
  proxyToAutoGen(req, res, '/agents');
});

// Start a new debate session
app.post('/api/debate/start', (req, res) => {
  console.log('🤖 Starting multi-agent debate:', req.body.prompt?.substring(0, 50) + '...');
  proxyToAutoGen(req, res, '/debate/start', 'POST');
});

// Get debate status
app.get('/api/debate/status/:sessionId', (req, res) => {
  proxyToAutoGen(req, res, `/debate/status/${req.params.sessionId}`);
});

// Get full debate result
app.get('/api/debate/result/:sessionId', (req, res) => {
  proxyToAutoGen(req, res, `/debate/result/${req.params.sessionId}`);
});

// Get debate rounds
app.get('/api/debate/rounds/:sessionId', (req, res) => {
  proxyToAutoGen(req, res, `/debate/rounds/${req.params.sessionId}`);
});

// ============================================
// TEST ROUTE
// ============================================
app.post('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API test successful',
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// ERROR HANDLING
// ============================================
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      '/api/health',
      '/api/agent/chat',
      '/api/design-analysis/analyze',
      '/api/asset-generation/generate-reve',
      '/api/image-editing/edit-reve',
      '/api/diagram-generation/generate',
      '/api/debate/start'
    ]
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║       🚀 CoCreate AI Design Server v2.0              ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  📡 Server:    http://localhost:${PORT}                  ║`);
  console.log('║  📊 Health:    /api/health                           ║');
  console.log('║  💬 Agent:     /api/agent/chat                       ║');
  console.log('║  🔍 Analysis:  /api/design-analysis/analyze          ║');
  console.log('║  🎨 Generate:  /api/asset-generation/generate-reve   ║');
  console.log('║  ✏️  Edit:      /api/image-editing/edit-reve          ║');
  console.log('║  📊 Diagram:   /api/diagram-generation/generate      ║');
  console.log('║  🤖 Debate:    /api/debate/start                     ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
});

export default app;