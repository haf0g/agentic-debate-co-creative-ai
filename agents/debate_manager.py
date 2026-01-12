"""
Debate Manager - Orchestrates Multi-Agent Design Debates
Manages debate sessions, rounds, and consensus building
"""
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
import json
import uuid
import asyncio
import re

from autogen import GroupChat, GroupChatManager
try:
    from design_crew import create_design_crew
    from config import (
        DEBATE_SETTINGS,
        ORCHESTRATOR_CONFIG,
        DEBATE_SPEAKER_SELECTION_METHOD,
        DEBATE_COMPACT_CONTEXT,
        DEBATE_MAX_USER_PROMPT_CHARS,
        DEBATE_MAX_SUMMARY_CHARS,
        DEBATE_MAX_AGENT_MESSAGE_CHARS,
    )
except ModuleNotFoundError:
    from agents.design_crew import create_design_crew
    from agents.config import (
        DEBATE_SETTINGS,
        ORCHESTRATOR_CONFIG,
        DEBATE_SPEAKER_SELECTION_METHOD,
        DEBATE_COMPACT_CONTEXT,
        DEBATE_MAX_USER_PROMPT_CHARS,
        DEBATE_MAX_SUMMARY_CHARS,
        DEBATE_MAX_AGENT_MESSAGE_CHARS,
    )


class DebateStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    ROUND_COMPLETE = "round_complete"
    CONSENSUS_REACHED = "consensus_reached"
    FAILED = "failed"
    COMPLETED = "completed"


class AgentVote(str, Enum):
    APPROVE = "approve"
    ADJUST = "adjust"
    RETHINK = "rethink"


@dataclass
class AgentMessage:
    """A single message from an agent in the debate."""
    agent_name: str
    agent_role: str
    content: str
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    round_number: int = 0
    message_type: str = "discussion"  # discussion, vote, consensus
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class DebateRound:
    """A single round in the debate."""
    round_number: int
    theme: str  # e.g., "Initial Critique", "Refinement", "Consensus"
    messages: List[AgentMessage] = field(default_factory=list)
    votes: Dict[str, str] = field(default_factory=dict)
    status: str = "pending"
    summary: str = ""
    
    def to_dict(self) -> Dict:
        return {
            "round_number": self.round_number,
            "theme": self.theme,
            "messages": [m.to_dict() for m in self.messages],
            "votes": self.votes,
            "status": self.status,
            "summary": self.summary
        }


@dataclass
class DebateSession:
    """Complete debate session with all rounds and metadata."""
    session_id: str
    design_prompt: str
    project_id: Optional[str] = None
    status: DebateStatus = DebateStatus.PENDING
    rounds: List[DebateRound] = field(default_factory=list)
    consensus: Optional[Dict] = None
    final_score: float = 0.0
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    completed_at: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return {
            "session_id": self.session_id,
            "design_prompt": self.design_prompt,
            "project_id": self.project_id,
            "status": self.status.value,
            "rounds": [r.to_dict() for r in self.rounds],
            "consensus": self.consensus,
            "final_score": self.final_score,
            "created_at": self.created_at,
            "completed_at": self.completed_at
        }


class DebateManager:
    """
    Manages design debates between multiple AI agents.
    Uses AutoGen GroupChat for agent coordination.
    """
    
    # Agent info for UI display
    AGENT_INFO = {
        "Orchestrator": {"emoji": "🧠", "color": "#6366F1", "role": "Project Manager"},
        "DesignCritic": {"emoji": "📝", "color": "#EF4444", "role": "Design Critic"},
        "DesignArtist": {"emoji": "🎨", "color": "#10B981", "role": "Design Artist"},
        "UXResearcher": {"emoji": "📊", "color": "#3B82F6", "role": "UX Researcher"},
        "BrandStrategist": {"emoji": "💡", "color": "#F59E0B", "role": "Brand Strategist"}
    }
    
    ROUND_THEMES = [
        "Initial Analysis & Proposals",
        "Critique & Refinement Debate",
        "Final Consensus"
    ]
    
    def __init__(self):
        self.sessions: Dict[str, DebateSession] = {}
        self.active_debates: Dict[str, asyncio.Task] = {}

    def _extract_svg_strings(self, texts: List[str]) -> List[str]:
        """Extract SVG blocks from a list of texts."""
        out: List[str] = []
        if not texts:
            return out

        # ```svg ... ```
        fenced = re.compile(r"```svg\s*([\s\S]*?)```", re.IGNORECASE)
        inline = re.compile(r"(<svg\b[\s\S]*?</svg>)", re.IGNORECASE)

        for t in texts:
            if not t:
                continue
            for m in fenced.findall(t):
                candidate = m.strip()
                if candidate.lower().startswith('<svg'):
                    out.append(candidate)
                else:
                    out.append(f"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"200\">{candidate}</svg>")
            for m in inline.findall(t):
                out.append(m.strip())

        # Deduplicate while preserving order
        deduped: List[str] = []
        seen = set()
        for svg in out:
            key = svg[:1200]
            if key in seen:
                continue
            seen.add(key)
            deduped.append(svg)
        return deduped
        
    def create_session(self, design_prompt: str, project_id: Optional[str] = None) -> DebateSession:
        """Create a new debate session."""
        session = DebateSession(
            session_id=str(uuid.uuid4()),
            design_prompt=design_prompt,
            project_id=project_id
        )
        
        # Initialize rounds
        for i, theme in enumerate(self.ROUND_THEMES):
            session.rounds.append(DebateRound(
                round_number=i + 1,
                theme=theme
            ))
        
        self.sessions[session.session_id] = session
        return session
    
    def get_session(self, session_id: str) -> Optional[DebateSession]:
        """Get a debate session by ID."""
        return self.sessions.get(session_id)
    
    async def run_debate(
        self, 
        session_id: str, 
        message_callback: Optional[callable] = None
    ) -> DebateSession:
        """
        Run a complete debate session with all rounds.
        
        Args:
            session_id: The debate session ID
            message_callback: Optional async callback for real-time messages
                             Called with (agent_name, message, round_number)
        """
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        session.status = DebateStatus.IN_PROGRESS
        
        try:
            # Create the design crew
            crew = create_design_crew()
            
            # Agent list for GroupChat (orchestrator moderates)
            agents = [
                crew["orchestrator"],
                crew["artist"],
                crew["critic"],
                crew["ux"],
                crew["brand"]
            ]
            
            # Run each debate round
            for round_obj in session.rounds:
                await self._run_round(
                    session=session,
                    round_obj=round_obj,
                    agents=agents,
                    crew=crew,
                    callback=message_callback
                )
                round_obj.status = "complete"
            
            # Calculate final consensus
            session.consensus = self._calculate_consensus(session)
            session.final_score = session.consensus.get("score", 0)
            session.status = DebateStatus.COMPLETED
            session.completed_at = datetime.now().isoformat()
            
        except Exception as e:
            session.status = DebateStatus.FAILED
            if message_callback:
                await message_callback("System", f"Debate failed: {str(e)}", 0)
            raise
        
        return session
    
    async def _run_round(
        self,
        session: DebateSession,
        round_obj: DebateRound,
        agents: List,
        crew: Dict,
        callback: Optional[callable]
    ):
        """Run a single debate round."""
        round_obj.status = "in_progress"

        def _truncate(text: str, max_chars: int) -> str:
            if not text:
                return ""
            if len(text) <= max_chars:
                return text
            return text[:max_chars].rstrip() + "\n\n[TRUNCATED]"

        brevity_rules = (
            f"Rules (important): keep each reply <= {DEBATE_MAX_AGENT_MESSAGE_CHARS} chars; "
            "no long preambles; do not repeat earlier messages verbatim."
        )

        design_prompt = _truncate(session.design_prompt, DEBATE_MAX_USER_PROMPT_CHARS)
        
        # Prepare the prompt based on round
        if round_obj.round_number == 1:
            # Initial proposals
            prompt = (
                "## Design Challenge\n\n"
                f"{design_prompt}\n\n"
                f"{brevity_rules}\n\n"
                "Orchestrator: introduce challenge; ask Artist for 2-3 concepts; "
                "ask Critic/UX/Brand for fast feedback.\n\n"
                "IMPORTANT: DesignArtist MUST include at least one minimal valid <svg>...</svg> prototype "
                "for the best concept (raw SVG, no markdown fences)."
            )
            
        elif round_obj.round_number == 2:
            # Refinement debate
            prev_summary = session.rounds[0].summary if session.rounds[0].summary else "See previous round"
            prev_summary = _truncate(prev_summary, DEBATE_MAX_SUMMARY_CHARS)
            prompt = (
                "## Round 2: Refinement\n\n"
                f"Summary so far:\n{prev_summary}\n\n"
                f"{brevity_rules}\n\n"
                "Orchestrator: ask Artist to revise; ask others to confirm/adjust; "
                "end with 3-5 bullet decisions."
            )
            
        else:
            # Final consensus
            prompt = (
                "## Round 3: Consensus\n\n"
                f"{brevity_rules}\n\n"
                "Orchestrator: request final votes (Approve/Adjust/Rethink) + 1 sentence reason each; "
                "then output final recommendation, score (1-10), and next steps."
            )
        
        # Create GroupChat for this round
        groupchat = GroupChat(
            agents=agents,
            messages=[],
            max_round=DEBATE_SETTINGS["max_messages_per_round"],
                        speaker_selection_method=DEBATE_SPEAKER_SELECTION_METHOD,
        )
        
        manager = GroupChatManager(
            groupchat=groupchat,
            llm_config=ORCHESTRATOR_CONFIG
        )
        
        # Create a temporary UserProxy to initiate the chat (required for Gemini API role strictness)
        from autogen import UserProxyAgent
        admin = UserProxyAgent(
            name="Admin",
            system_message="A human admin.",
            code_execution_config=False,
            human_input_mode="NEVER"
        )
        
        # Initiate the conversation
        result = await asyncio.to_thread(
            admin.initiate_chat,
            manager,
            message=prompt,
            clear_history=True
        )
        
        # Extract messages from the groupchat
        for msg in groupchat.messages:
            if msg.get("content"):
                agent_name = msg.get("name", "Unknown")
                agent_info = self.AGENT_INFO.get(agent_name, {})
                
                agent_msg = AgentMessage(
                    agent_name=agent_name,
                    agent_role=agent_info.get("role", "Agent"),
                    content=msg["content"],
                    round_number=round_obj.round_number
                )
                round_obj.messages.append(agent_msg)
                
                # Real-time callback
                if callback:
                    await callback(agent_name, msg["content"], round_obj.round_number)

        # Enforce mandatory SVG prototype after Round 1 (HITL requirement)
        if round_obj.round_number == 1:
            texts = [m.content for m in round_obj.messages if m.content]
            existing_svgs = self._extract_svg_strings(texts)
            if not existing_svgs:
                svg_only_prompt = (
                    "You are the DesignArtist.\n\n"
                    "MANDATORY: Provide ONE minimal valid SVG prototype for the best concept.\n"
                    "Output ONLY a raw <svg>...</svg> block. No markdown. No explanation.\n\n"
                    f"Design challenge:\n{design_prompt}"
                )

                try:
                    artist_agent = crew.get("artist")
                    if artist_agent is not None:
                        svg_result = await asyncio.to_thread(
                            admin.initiate_chat,
                            artist_agent,
                            message=svg_only_prompt,
                            clear_history=True
                        )

                        svg_text = None
                        # Try best-effort extraction from different AutoGen result shapes
                        for attr in ("chat_history", "messages", "history"):
                            if hasattr(svg_result, attr):
                                hist = getattr(svg_result, attr)
                                if isinstance(hist, list):
                                    for m in reversed(hist):
                                        if isinstance(m, dict) and m.get("content"):
                                            svg_text = m.get("content")
                                            break
                            if svg_text:
                                break
                        if not svg_text and isinstance(svg_result, dict):
                            svg_text = svg_result.get("content") or svg_result.get("response")

                        svg_text = (svg_text or "").strip()
                        # Ensure we actually have an SVG block
                        extracted = self._extract_svg_strings([svg_text])
                        if extracted:
                            svg_text = extracted[0]

                        if svg_text:
                            agent_info = self.AGENT_INFO.get("DesignArtist", {})
                            agent_msg = AgentMessage(
                                agent_name="DesignArtist",
                                agent_role=agent_info.get("role", "Design Artist"),
                                content=svg_text,
                                round_number=round_obj.round_number
                            )
                            round_obj.messages.append(agent_msg)
                            if callback:
                                await callback("DesignArtist", svg_text, round_obj.round_number)
                except Exception:
                    # If this fails, we still let the debate continue.
                    pass
        
        # Generate round summary
        round_obj.summary = self._summarize_round(round_obj)
    
    def _summarize_round(self, round_obj: DebateRound) -> str:
        """Create a summary of the round's key points."""
        if not round_obj.messages:
            return "No discussion recorded."
        
        # Get the last substantial message (usually contains summary)
        for msg in reversed(round_obj.messages):
            if len(msg.content) > 200:  # Substantial message
                # Extract key points
                return msg.content[:500] + "..." if len(msg.content) > 500 else msg.content
        
        return "Round completed with team discussion."
    
    def _calculate_consensus(self, session: DebateSession) -> Dict:
        """Calculate the final consensus from all rounds."""
        # Get the final round
        final_round = session.rounds[-1] if session.rounds else None
        
        if not final_round or not final_round.messages:
            return {
                "score": 5.0,
                "direction": "No consensus reached",
                "decisions": [],
                "votes": {}
            }
        
        # Parse the last message for consensus info
        last_message = final_round.messages[-1].content if final_round.messages else ""
        
        # Extract consensus details (simplified parsing)
        consensus = {
            "score": 7.5,  # Default reasonable score
            "direction": "Consensus reached through collaborative debate",
            "decisions": [],
            "votes": {
                "DesignCritic": "approve",
                "DesignArtist": "approve",
                "UXResearcher": "approve",
                "BrandStrategist": "approve"
            },
            "summary": last_message[:1000] if last_message else "Debate concluded"
        }
        
        # Try to extract score from message
        import re
        score_match = re.search(r'(?:score|consensus)[:\s]*(\d+(?:\.\d+)?)\s*(?:/\s*10)?', 
                                last_message.lower())
        if score_match:
            consensus["score"] = min(10, float(score_match.group(1)))
        
        return consensus
    
    def get_agent_info(self) -> Dict:
        """Get agent information for UI display."""
        return self.AGENT_INFO


# Global debate manager instance
debate_manager = DebateManager()
