"""
FastAPI Backend for CoCreate Design Debate System
Exposes REST and WebSocket endpoints for frontend integration
"""
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict
import asyncio
import json
import uvicorn

try:
    from debate_manager import debate_manager, DebateStatus
    from config import SERVER_HOST, SERVER_PORT, DEBATE_SETTINGS
except ModuleNotFoundError:
    from agents.debate_manager import debate_manager, DebateStatus
    from agents.config import SERVER_HOST, SERVER_PORT, DEBATE_SETTINGS

# FastAPI App
app = FastAPI(
    title="CoCreate Agentic API",
    description="Multi-Agent Design Debate System using AutoGen",
    version="1.0.0"
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class DebateRequest(BaseModel):
    prompt: str
    project_id: Optional[str] = None


class DebateResponse(BaseModel):
    session_id: str
    status: str
    message: str


class SessionStatus(BaseModel):
    session_id: str
    status: str
    current_round: int
    total_rounds: int
    messages_count: int
    consensus: Optional[Dict] = None


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                self.active_connections.pop(session_id, None)
    
    async def broadcast(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            for connection in list(self.active_connections[session_id]):
                try:
                    await connection.send_json(message)
                except Exception:
                    self.disconnect(connection, session_id)

    async def close_session(self, session_id: str, code: int = 1000, reason: str = "session complete"):
        connections = list(self.active_connections.get(session_id, []))
        for ws in connections:
            try:
                await ws.close(code=code)
            except Exception:
                pass
            self.disconnect(ws, session_id)


manager = ConnectionManager()


# REST Endpoints
@app.get("/")
async def root():
    return {
        "service": "CoCreate Agentic API",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "start_debate": "POST /debate/start",
            "get_status": "GET /debate/status/{session_id}",
            "get_result": "GET /debate/result/{session_id}",
            "websocket": "WS /debate/ws/{session_id}"
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "agents": "ready"}


@app.get("/agents")
async def get_agents():
    """Get information about all available agents."""
    return {
        "agents": debate_manager.get_agent_info(),
        "debate_settings": DEBATE_SETTINGS
    }


# SSE Endpoint for streaming debate (used by frontend)
class DebateSSERequest(BaseModel):
    prompt: str
    project_id: Optional[str] = None
    chat_context: Optional[List[Dict]] = None
    image_analyses: Optional[List[Dict]] = None


@app.post("/debate/start")
async def start_debate_sse(request: DebateSSERequest):
    """
    Start a new design debate session with SSE streaming.
    Returns Server-Sent Events for real-time updates.
    """
    
    async def event_generator():
        message_queue = asyncio.Queue()
        
        try:
            print(f"🎬 [SSE] Starting debate for prompt: {request.prompt[:100]}...")
            
            # Create the session
            session = debate_manager.create_session(
                design_prompt=request.prompt,
                project_id=request.project_id
            )
            
            yield f"data: {json.dumps({'type': 'session_started', 'session_id': session.session_id})}\n\n"
            
            # Define callback for real-time updates
            async def message_callback(agent_name: str, content: str, round_number: int):
                agent_info = debate_manager.AGENT_INFO.get(agent_name, {})
                await message_queue.put({
                    "type": "agent_message",
                    "agent": agent_name,
                    "emoji": agent_info.get("emoji", "🤖"),
                    "color": agent_info.get("color", "#666"),
                    "role": agent_info.get("role", "Agent"),
                    "content": content,
                    "round": round_number
                })
            
            # Also send agent_start events
            original_callback = message_callback
            
            async def enhanced_callback(agent_name: str, content: str, round_number: int):
                # Send agent_start first time we see this agent in this round
                await message_queue.put({
                    "type": "agent_start",
                    "agent": agent_name,
                    "round": round_number
                })
                await original_callback(agent_name, content, round_number)
            
            # Run debate in background task
            async def run_debate():
                try:
                    await debate_manager.run_debate(
                        session.session_id,
                        message_callback=enhanced_callback
                    )
                    # Send completion
                    await message_queue.put({
                        "type": "complete",
                        "session_id": session.session_id,
                        "consensus": session.consensus,
                        "svg_artifacts": getattr(session, 'svg_artifacts', []),
                        "final_score": session.final_score
                    })
                except Exception as e:
                    import traceback
                    print(f"❌ Debate error: {e}\n{traceback.format_exc()}")
                    await message_queue.put({
                        "type": "error",
                        "message": str(e)
                    })
                finally:
                    await message_queue.put(None)  # Signal end
            
            # Start debate task
            debate_task = asyncio.create_task(run_debate())
            
            # Stream messages from queue
            while True:
                try:
                    msg = await asyncio.wait_for(message_queue.get(), timeout=120.0)
                    if msg is None:
                        break
                    yield f"data: {json.dumps(msg)}\n\n"
                except asyncio.TimeoutError:
                    # Send keepalive
                    yield f"data: {json.dumps({'type': 'keepalive'})}\n\n"
            
            # Wait for debate to complete
            await debate_task
            
        except Exception as e:
            import traceback
            error_msg = f"SSE Error: {str(e)}"
            print(f"❌ {error_msg}\n{traceback.format_exc()}")
            yield f"data: {json.dumps({'type': 'error', 'message': error_msg})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


# Keep the old endpoint for backward compatibility with WebSocket clients
@app.post("/debate/start-ws", response_model=DebateResponse)
async def start_debate_websocket(request: DebateRequest):
    """
    Start a new design debate session.
    Returns immediately with session_id, debate runs in background.
    """
    try:
        print(f"🎬 Starting debate for prompt: {request.prompt}")
        # Create the session
        session = debate_manager.create_session(
            design_prompt=request.prompt,
            project_id=request.project_id
        )
    except Exception as e:
        import traceback
        error_msg = f"Failed to create debate session: {str(e)}\n{traceback.format_exc()}"
        print(f"❌ Error: {error_msg}")
        raise HTTPException(status_code=500, detail=str(e))
    
    # Define callback for real-time updates
    async def message_callback(agent_name: str, content: str, round_number: int):
        agent_info = debate_manager.AGENT_INFO.get(agent_name, {})
        await manager.broadcast(session.session_id, {
            "type": "agent_message",
            "agent": agent_name,
            "emoji": agent_info.get("emoji", "🤖"),
            "color": agent_info.get("color", "#666"),
            "role": agent_info.get("role", "Agent"),
            "content": content,
            "round": round_number,
            "timestamp": asyncio.get_event_loop().time()
        })
    
    # Run debate in background
    async def run_debate_task():
        try:
            await debate_manager.run_debate(
                session.session_id,
                message_callback=message_callback
            )
            # Notify completion
            await manager.broadcast(session.session_id, {
                "type": "debate_complete",
                "session_id": session.session_id,
                "consensus": session.consensus,
                "final_score": session.final_score
            })
            # Close WS connections after completion (helps avoid lingering open connections)
            await manager.close_session(session.session_id, code=1000, reason="debate complete")
        except Exception as e:
            await manager.broadcast(session.session_id, {
                "type": "debate_error",
                "error": str(e)
            })
            await manager.close_session(session.session_id, code=1011, reason="debate error")
    
    # Start background task
    asyncio.create_task(run_debate_task())
    
    return DebateResponse(
        session_id=session.session_id,
        status="started",
        message=f"Debate started with {len(session.rounds)} rounds. Connect to WebSocket for real-time updates."
    )


@app.get("/debate/status/{session_id}")
async def get_debate_status(session_id: str):
    """Get the current status of a debate session."""
    session = debate_manager.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Calculate current round
    current_round = 1
    for i, round_obj in enumerate(session.rounds):
        if round_obj.status != "complete":
            current_round = i + 1
            break
        current_round = i + 1
    
    # Count total messages
    total_messages = sum(len(r.messages) for r in session.rounds)
    
    return {
        "session_id": session.session_id,
        "status": session.status.value,
        "current_round": current_round,
        "total_rounds": len(session.rounds),
        "messages_count": total_messages,
        "design_prompt": session.design_prompt,
        "created_at": session.created_at
    }


@app.get("/debate/result/{session_id}")
async def get_debate_result(session_id: str):
    """Get the full result of a completed debate."""
    session = debate_manager.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session.to_dict()


@app.get("/debate/rounds/{session_id}")
async def get_debate_rounds(session_id: str):
    """Get all rounds and messages from a debate."""
    session = debate_manager.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session.session_id,
        "rounds": [r.to_dict() for r in session.rounds]
    }


# WebSocket for real-time updates
@app.websocket("/debate/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket connection for real-time debate updates.
    Connect before starting the debate to receive all messages.
    """
    await manager.connect(websocket, session_id)
    
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "session_id": session_id,
            "message": "Connected to debate stream"
        })
        
        # Keep connection alive and handle any incoming messages
        while True:
            try:
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=60.0
                )
                # Handle ping/pong or other client messages
                if data == "ping":
                    await websocket.send_json({"type": "pong"})
            except asyncio.TimeoutError:
                # Send keepalive
                await websocket.send_json({"type": "keepalive"})
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)


# Run the server
if __name__ == "__main__":
    print("🚀 Starting CoCreate Agentic API...")
    print(f"📡 Server (preferred): http://{SERVER_HOST}:{SERVER_PORT}")
    print("🤖 Agents: DesignCritic, DesignArtist, UXResearcher, BrandStrategist, Orchestrator")
    print("=" * 60)

    # On Windows, Errno 10048 means the port is already in use.
    # For smoother local testing, try a few ports before giving up.
    last_error = None
    for port in range(SERVER_PORT, SERVER_PORT + 10):
        try:
            if port != SERVER_PORT:
                print(f"⚠️ Port {SERVER_PORT} busy, trying {port}...")
            uvicorn.run(
                app,
                host=SERVER_HOST,
                port=port,
                log_level="info"
            )
            last_error = None
            break
        except OSError as e:
            last_error = e
            if getattr(e, "errno", None) == 10048:
                continue
            raise

    if last_error is not None:
        raise last_error
