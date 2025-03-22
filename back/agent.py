from langchain_google_genai import GoogleGenerativeAI
from langchain.agents import Tool, AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferMemory
from langchain.schema import SystemMessage
import os
from dotenv import load_dotenv
from typing import List, Dict, Any

# Import custom tools
from tools.transfer_money import transfer_money_tool
from tools.spending_summary import spending_summary_tool
from tools.search_notes import search_notes_tool
from tools.fraud_detection import check_fraud_tool
from tools.budget_advice import budget_advice_tool

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def create_agent(user_id: str) -> AgentExecutor:
    """
    Create an AI agent with tools for personal finance assistance.
    
    Args:
        user_id: The ID of the user to create the agent for.
        
    Returns:
        An AgentExecutor instance configured with finance tools.
    """
    # Initialize the Gemini model
    llm = GoogleGenerativeAI(
        model="gemini-pro",
        google_api_key=GEMINI_API_KEY,
        temperature=0.2,
    )
    
    # Define the tools available to the agent
    tools = [
        Tool(
            name="TransferMoney",
            func=lambda args: transfer_money_tool(user_id=user_id, **args),
            description="Transfer money to a recipient. Input should include recipient name and amount.",
        ),
        Tool(
            name="GetSpendingSummary",
            func=lambda args: spending_summary_tool(user_id=user_id, **args),
            description="Get a summary of spending by category, time period, or total.",
        ),
        Tool(
            name="SearchTransactions",
            func=lambda args: search_notes_tool(user_id=user_id, **args),
            description="Search for similar transactions based on description or keywords.",
        ),
        Tool(
            name="CheckFraud",
            func=lambda args: check_fraud_tool(user_id=user_id, **args),
            description="Check if a transaction might be fraudulent.",
        ),
        Tool(
            name="CanIAfford",
            func=lambda args: budget_advice_tool(user_id=user_id, **args),
            description="Check if a purchase is affordable based on budget and financial situation.",
        ),
    ]
    
    # Set up memory for conversation history
    memory = ConversationBufferMemory(return_messages=True)
    
    # Create the system message template
    system_message = SystemMessage(
        content="""
        You are a personal finance assistant AI. You can analyze user's financial information and transaction history,
        and execute financial tasks through natural language commands.
        
        Available tools:
        - TransferMoney: Transfer money to a recipient.
        - GetSpendingSummary: Provide a summary of spending information.
        - SearchTransactions: Search for similar transaction records.
        - CheckFraud: Check for possible fraud in transactions.
        - CanIAfford: Determine whether a purchase is affordable based on the user's budget.
        
        Always respond with a helpful and friendly attitude. Prioritize the user's financial security.
        For large transactions or suspicious requests, go through additional verification steps.
        
        Always respond in English, regardless of the language used in the query.
        """
    )
    
    # Create the prompt template
    prompt = ChatPromptTemplate.from_messages(
        [
            system_message,
            MessagesPlaceholder(variable_name="chat_history"),
            ("user", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ]
    )
    
    # Create the agent
    agent = create_openai_functions_agent(llm, tools, prompt)
    
    # Create the agent executor
    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        memory=memory,
        verbose=True,
        return_intermediate_steps=True,
    )
    
    return agent_executor

def process_message(user_id: str, message: str) -> Dict[str, Any]:
    """
    Process a user message through the AI agent.
    
    Args:
        user_id: The ID of the user sending the message.
        message: The message from the user.
        
    Returns:
        A dictionary containing the agent's response and any actions performed.
    """
    agent = create_agent(user_id)
    response = agent.invoke({"input": message})
    
    return {
        "response": response["output"],
        "actions": [step[0].tool for step in response["intermediate_steps"]] if "intermediate_steps" in response else [],
    }
