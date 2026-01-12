/**
 * Debate Routes - Proxy to Python AutoGen Backend
 * Forwards debate requests to the Python FastAPI server
 */
const express = require('express');
const router = express.Router();
const http = require('http');

// Python backend configuration
const PYTHON_BACKEND = {
    host: '127.0.0.1',
    port: 8000
};

/**
 * Proxy helper function
 */
const proxyRequest = (req, res, path, method = 'GET') => {
    const options = {
        hostname: PYTHON_BACKEND.host,
        port: PYTHON_BACKEND.port,
        path: path,
        method: method,
        headers: {
            'Content-Type': 'application/json'
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
        console.error('Proxy error:', error);
        res.status(503).json({
            error: 'Python backend unavailable',
            message: 'Ensure the AutoGen server is running: cd agents && python main.py'
        });
    });

    if (method === 'POST' && req.body) {
        proxyReq.write(JSON.stringify(req.body));
    }

    proxyReq.end();
};

/**
 * @route GET /api/debate/health
 * @desc Check if Python backend is available
 */
router.get('/health', (req, res) => {
    proxyRequest(req, res, '/health');
});

/**
 * @route GET /api/debate/agents
 * @desc Get agent information
 */
router.get('/agents', (req, res) => {
    proxyRequest(req, res, '/agents');
});

/**
 * @route POST /api/debate/start
 * @desc Start a new debate session
 * @body { prompt: string, project_id?: string }
 */
router.post('/start', (req, res) => {
    proxyRequest(req, res, '/debate/start', 'POST');
});

/**
 * @route GET /api/debate/status/:sessionId
 * @desc Get debate session status
 */
router.get('/status/:sessionId', (req, res) => {
    proxyRequest(req, res, `/debate/status/${req.params.sessionId}`);
});

/**
 * @route GET /api/debate/result/:sessionId
 * @desc Get full debate result
 */
router.get('/result/:sessionId', (req, res) => {
    proxyRequest(req, res, `/debate/result/${req.params.sessionId}`);
});

/**
 * @route GET /api/debate/rounds/:sessionId
 * @desc Get all debate rounds
 */
router.get('/rounds/:sessionId', (req, res) => {
    proxyRequest(req, res, `/debate/rounds/${req.params.sessionId}`);
});

module.exports = router;
