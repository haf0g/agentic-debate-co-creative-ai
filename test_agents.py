import asyncio
import os
from dotenv import load_dotenv
from agents.config import LLM_CONFIG
from autogen import AssistantAgent, UserProxyAgent

# Charger les variables d'environnement
load_dotenv()

async def test_agent():
    print("🧪 Test de la configuration des agents...")
    print(f"Configuration LLM: {LLM_CONFIG['config_list'][0]['model']}")
    
    try:
        # Créer un agent simple
        agent = AssistantAgent(
            name="TestAgent",
            system_message="You are a helpful AI assistant. Respond with 'Hello! I am working!'",
            llm_config=LLM_CONFIG
        )
        
        user = UserProxyAgent(
            name="User",
            human_input_mode="NEVER",
            code_execution_config=False
        )
        
        print("🤖 Envoi d'un message à l'agent...")
        
        # Test de communication simple
        response = await user.a_initiate_chat(
            agent,
            message="Are you working?",
            max_turns=1
        )
        
        print("✅ Réponse reçue!")
        print(f"Contenu: {response.chat_history[-1]['content']}")
        
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_agent())
