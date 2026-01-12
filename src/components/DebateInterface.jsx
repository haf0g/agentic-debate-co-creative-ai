import React, { useState, useEffect, useRef, useMemo } from 'react';
import AgentCard from './AgentCard';
import SvgPreview from './SvgPreview';
import { extractSvgStrings } from '../utils/svgArtifacts';
import '../styles/debate.css';

/**
 * DebateInterface - Real-time visualization of multi-agent design debates
 * Connects to Python AutoGen backend via WebSocket
 */
const DebateInterface = ({
    designPrompt,
    projectId,
    autoStart = false,
    onDebateComplete,
    onClose
}) => {
    const [sessionId, setSessionId] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, connecting, debating, complete, error
    const [currentRound, setCurrentRound] = useState(1);
    const [messages, setMessages] = useState([]);
    const [consensus, setConsensus] = useState(null);
    const [speakingAgent, setSpeakingAgent] = useState(null);
    const [error, setError] = useState(null);

    const wsRef = useRef(null);
    const messagesEndRef = useRef(null);
    const autoStartedRef = useRef(false);

    const svgArtifacts = useMemo(() => {
        const texts = [];
        for (const msg of messages) {
            if (msg?.content) texts.push(msg.content);
        }
        if (consensus?.summary) texts.push(consensus.summary);
        if (consensus?.direction) texts.push(consensus.direction);
        return extractSvgStrings(texts);
    }, [messages, consensus]);

    // Agent info for display
    const AGENTS = {
        'Orchestrator': { emoji: '🧠', color: '#6366F1', role: 'Project Manager' },
        'DesignCritic': { emoji: '📝', color: '#EF4444', role: 'Design Critic' },
        'DesignArtist': { emoji: '🎨', color: '#10B981', role: 'Design Artist' },
        'UXResearcher': { emoji: '📊', color: '#3B82F6', role: 'UX Researcher' },
        'BrandStrategist': { emoji: '💡', color: '#F59E0B', role: 'Brand Strategist' }
    };

    const ROUND_THEMES = [
        'Initial Analysis & Proposals',
        'Critique & Refinement Debate',
        'Final Consensus'
    ];

    // Check backend health on mount
    useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await fetch('/api/debate/health');
                if (!res.ok) {
                    console.warn('Debate backend health check failed:', res.status);
                    // Don't set error yet, let the user try to start
                } else {
                    console.log('Debate backend is ready');
                }
            } catch (e) {
                console.error('Debate backend unreachable:', e);
            }
        };
        checkHealth();
    }, []);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Start debate
    const startDebate = async () => {
        setStatus('connecting');
        setError(null);

        try {
            // Start debate via REST API (through Node.js proxy to avoid CORS)
            const response = await fetch('/api/debate/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: designPrompt,
                    project_id: projectId
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || `Failed to start debate (${response.status})`);
            }

            const data = await response.json();
            setSessionId(data.session_id);

            // Connect WebSocket for real-time updates
            connectWebSocket(data.session_id);

        } catch (err) {
            setError(err.message);
            setStatus('error');
        }
    };

    // Auto-start when requested (e.g., rerun from HITL modal)
    useEffect(() => {
        if (!autoStart) return;
        if (status !== 'idle') return;
        if (autoStartedRef.current) return;
        if (!designPrompt?.trim()) return;

        autoStartedRef.current = true;
        startDebate();
    }, [autoStart, status, designPrompt]);

    // WebSocket connection
    const connectWebSocket = (sid) => {
        const ws = new WebSocket(`ws://127.0.0.1:8000/debate/ws/${sid}`);
        wsRef.current = ws;

        ws.onopen = () => {
            setStatus('debating');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'connected':
                    console.log('Connected to debate stream');
                    break;

                case 'agent_message':
                    setSpeakingAgent(data.agent);
                    setCurrentRound(data.round);
                    setMessages(prev => [...prev, {
                        id: Date.now(),
                        agent: data.agent,
                        emoji: data.emoji,
                        color: data.color,
                        role: data.role,
                        content: data.content,
                        round: data.round,
                        timestamp: new Date()
                    }]);
                    // Clear speaking indicator after a delay
                    setTimeout(() => setSpeakingAgent(null), 1000);
                    break;

                case 'debate_complete':
                    setConsensus(data.consensus);
                    setStatus('complete');
                    if (onDebateComplete) {
                        const artifacts = extractSvgStrings([
                            ...messages.map(m => m?.content).filter(Boolean),
                            data?.consensus?.summary,
                            data?.consensus?.direction
                        ]);
                        onDebateComplete({ ...data, svgArtifacts: artifacts });
                    }
                    break;

                case 'debate_error':
                    setError(data.error);
                    setStatus('error');
                    break;

                case 'keepalive':
                case 'pong':
                    break;

                default:
                    console.log('Unknown message type:', data.type);
            }
        };

        ws.onerror = (err) => {
            setError('WebSocket connection failed');
            setStatus('error');
        };

        ws.onclose = () => {
            if (status === 'debating') {
                setError('Connection lost');
            }
        };
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    return (
        <div className="debate-interface">
            {/* Header */}
            <div className="debate-header">
                <div className="debate-title">
                    <span className="debate-icon">🤖</span>
                    <h2>Design Debate</h2>
                    <span className={`debate-status status-${status}`}>
                        {status === 'idle' && '⏸ Ready'}
                        {status === 'connecting' && '🔄 Connecting...'}
                        {status === 'debating' && '💬 In Progress'}
                        {status === 'complete' && '✅ Complete'}
                        {status === 'error' && '❌ Error'}
                    </span>
                </div>
                {onClose && (
                    <button className="debate-close" onClick={onClose}>×</button>
                )}
            </div>

            {/* Design Prompt */}
            <div className="debate-prompt">
                <span className="prompt-label">Challenge:</span>
                <p>{designPrompt}</p>
            </div>

            {/* Round Progress */}
            <div className="debate-rounds">
                {ROUND_THEMES.map((theme, index) => (
                    <div
                        key={index}
                        className={`round-indicator ${currentRound > index + 1 ? 'complete' :
                            currentRound === index + 1 ? 'active' : ''
                            }`}
                    >
                        <span className="round-number">{index + 1}</span>
                        <span className="round-theme">{theme}</span>
                    </div>
                ))}
            </div>

            {/* Agent Cards */}
            <div className="debate-agents">
                {Object.entries(AGENTS).map(([name, info]) => (
                    <AgentCard
                        key={name}
                        name={name}
                        emoji={info.emoji}
                        color={info.color}
                        role={info.role}
                        isSpeaking={speakingAgent === name}
                    />
                ))}
            </div>

            {/* Messages Timeline */}
            <div className="debate-messages">
                {status === 'idle' && (
                    <div className="debate-start-prompt">
                        <button
                            className="start-debate-btn"
                            onClick={startDebate}
                        >
                            🚀 Start Design Debate
                        </button>
                        <p>Watch AI agents collaborate and debate on your design challenge</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className="debate-message"
                        style={{ borderLeftColor: msg.color }}
                    >
                        <div className="message-header">
                            <span className="message-agent" style={{ color: msg.color }}>
                                {msg.emoji} {msg.agent}
                            </span>
                            <span className="message-role">{msg.role}</span>
                            <span className="message-round">Round {msg.round}</span>
                        </div>
                        <div className="message-content">
                            {msg.content}
                        </div>
                    </div>
                ))}

                {speakingAgent && (
                    <div className="typing-indicator">
                        <span style={{ color: AGENTS[speakingAgent]?.color }}>
                            {AGENTS[speakingAgent]?.emoji} {speakingAgent} is thinking...
                        </span>
                        <div className="typing-dots">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Consensus Result */}
            {consensus && (
                <div className="debate-consensus">
                    <h3>🎯 Consensus Reached</h3>
                    <div className="consensus-score">
                        <span className="score-label">Agreement Score</span>
                        <span className="score-value">{consensus.score}/10</span>
                    </div>
                    <div className="consensus-votes">
                        {Object.entries(consensus.votes || {}).map(([agent, vote]) => (
                            <div key={agent} className={`vote vote-${vote}`}>
                                <span>{AGENTS[agent]?.emoji}</span>
                                <span>{vote}</span>
                            </div>
                        ))}
                    </div>
                    <div className="consensus-summary">
                        <h4>Final Recommendation</h4>
                        <p>{consensus.summary || consensus.direction}</p>
                    </div>

                    {/* SVG Artifacts */}
                    {svgArtifacts.length > 0 && (
                        <div className="debate-artifacts">
                            <h4>SVG Artifacts</h4>
                            <p className="artifacts-hint">
                                Ces SVG viennent des messages du débat. Vous pouvez les ouvrir dans un onglet HTML ou les télécharger.
                            </p>
                            <div className="artifacts-grid">
                                {svgArtifacts.map((svg, idx) => (
                                    <SvgPreview key={idx} svg={svg} title={`SVG ${idx + 1}`} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="debate-error">
                    <span>⚠️ {error}</span>
                    <button onClick={() => {
                        setError(null);
                        setStatus('idle');
                    }}>
                        Retry
                    </button>
                </div>
            )}
        </div>
    );
};

export default DebateInterface;
