import React from 'react';

/**
 * AgentCard - Individual agent display with avatar and speaking indicator
 */
const AgentCard = ({ name, emoji, color, role, isSpeaking }) => {
    return (
        <div
            className={`agent-card ${isSpeaking ? 'speaking' : ''}`}
            style={{ '--agent-color': color }}
        >
            <div className="agent-avatar" style={{ backgroundColor: color }}>
                <span className="agent-emoji">{emoji}</span>
                {isSpeaking && (
                    <div className="speaking-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                )}
            </div>
            <div className="agent-info">
                <span className="agent-name">{name.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="agent-role">{role}</span>
            </div>
        </div>
    );
};

export default AgentCard;
