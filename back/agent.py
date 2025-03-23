import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import SystemMessage, HumanMessage, AIMessage
from langchain.tools import Tool
from langchain.agents import AgentExecutor, create_react_agent
from langchain.prompts import ChatPromptTemplate
from dotenv import load_dotenv
from supabase import create_client
import json
import re
import uuid
load_dotenv()


# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('ANON_SUPABASE_KEY')
supabase = create_client(supabase_url, supabase_key)

# Initialize the chat model
chat_model = ChatGoogleGenerativeAI(model="gemini-2.0-flash")

def get_transac_hist(user_id):
    response = supabase.table('transactions').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
    transactions = response.data

    string = ""
    for transaction in transactions:
        string += f"{transaction['created_at']} | {transaction['description']}; {transaction['note']}: ${transaction['amount']}\n"

    return string[:-1]

def get_all_users(current_user_id):
    """Get all users from the database except the current user"""
    response = supabase.table('users').select('user_id,first_name,last_name').neq('user_id', current_user_id).execute()
    return response.data

def get_user_wallet(user_id):
    """Get a user's wallet information"""
    response = supabase.table('wallets').select('*').eq('user_id', user_id).execute()
    if response.data:
        return response.data[0]
    return None

def parse_transfer_input(x, current_user_id):
    """Parse the transfer input, with robust error handling"""
    try:
        # First try parsing directly as JSON
        params = json.loads(x)
        # Force the sender_id to be the current user
        params['sender_id'] = current_user_id
        return params
    except json.JSONDecodeError:
        # If that fails, try to extract a JSON object from the text
        try:
            # Look for data between { and }
            match = re.search(r'({.*})', x, re.DOTALL)
            if match:
                json_str = match.group(1)
                params = json.loads(json_str)
                # Force the sender_id to be the current user
                params['sender_id'] = current_user_id
                return params
            
            # If no brackets found, let's try to parse key-value pairs
            # Expected format: recipient_id: value, amount: value
            result = {'sender_id': current_user_id}
            
            # Extract recipient_id
            recipient_match = re.search(r'recipient_id["\s:]+([^,\s"]+)', x)
            if recipient_match:
                result['recipient_id'] = recipient_match.group(1).strip('"\'')
                
            # Extract amount
            amount_match = re.search(r'amount["\s:]+([^,\s"]+)', x)
            if amount_match:
                result['amount'] = amount_match.group(1).strip('"\'')
                
            # Extract description (if available)
            desc_match = re.search(r'description["\s:]+([^,\s"]+)', x)
            if desc_match:
                result['description'] = desc_match.group(1).strip('"\'')
                
            if 'recipient_id' in result and 'amount' in result:
                return result
                
            raise ValueError("Could not parse transfer parameters from input")
        except Exception as e:
            return {"error": f"Failed to parse transfer input: {str(e)}\nInput was: {x}"}

def prepare_transfer(sender_id, recipient_id, amount, description="Quick Transfer"):
    """Validate and prepare a transfer between users without executing it"""
    try:
        # Convert amount to float if it's a string
        if isinstance(amount, str):
            # Remove any currency symbols and commas
            amount = re.sub(r'[^\d.]', '', amount)
            amount = float(amount)
            
        # Check if sender has enough funds
        sender_wallet = get_user_wallet(sender_id)
        if not sender_wallet:
            return {"success": False, "error": "Sender wallet not found"}
        
        if sender_wallet['debit_balance'] < amount:
            return {"success": False, "error": f"Insufficient funds. Your balance is ${sender_wallet['debit_balance']}"}
        
        # Check if recipient exists
        recipient_wallet = get_user_wallet(recipient_id)
        if not recipient_wallet:
            return {"success": False, "error": "Recipient wallet not found"}
        
        # Get recipient name for better response
        recipient_info = supabase.table('users').select('first_name,last_name').eq('user_id', recipient_id).execute()
        recipient_name = "the recipient"
        if recipient_info.data:
            recipient_name = f"{recipient_info.data[0]['first_name']} {recipient_info.data[0]['last_name']}"
        
        # Generate a transfer ID
        transfer_id = str(uuid.uuid4())
        
        # Create a transfer object that will be stored for later confirmation
        transfer = {
            "transfer_id": transfer_id,
            "sender_id": sender_id,
            "recipient_id": recipient_id,
            "amount": amount,
            "description": description,
            "recipient_name": recipient_name,
            "sender_balance": sender_wallet['debit_balance']
        }
        
        return {
            "success": True,
            "transfer": transfer,
            "message": f"Ready to transfer ${amount:.2f} to {recipient_name}. Your current balance is ${sender_wallet['debit_balance']:.2f}. Please confirm this transfer."
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def execute_transfer(transfer):
    """Execute a prepared transfer"""
    try:
        sender_id = transfer["sender_id"]
        recipient_id = transfer["recipient_id"]
        amount = transfer["amount"]
        description = transfer["description"]
        recipient_name = transfer["recipient_name"]
        
        # Check again if sender has enough funds (balance might have changed)
        sender_wallet = get_user_wallet(sender_id)
        if not sender_wallet:
            return {"success": False, "error": "Sender wallet not found"}
        
        if sender_wallet['debit_balance'] < amount:
            return {"success": False, "error": f"Insufficient funds. Your balance is ${sender_wallet['debit_balance']}"}
        
        # Check if recipient exists (might have been deleted)
        recipient_wallet = get_user_wallet(recipient_id)
        if not recipient_wallet:
            return {"success": False, "error": "Recipient wallet not found"}
        
        # Update sender's wallet
        supabase.table('wallets').update({'debit_balance': sender_wallet['debit_balance'] - amount}).eq('user_id', sender_id).execute()
        
        # Update recipient's wallet
        supabase.table('wallets').update({'debit_balance': recipient_wallet['debit_balance'] + amount}).eq('user_id', recipient_id).execute()
        
        # Create sender transaction (expense)
        sender_transaction = {
            'user_id': sender_id,
            'description': description,
            'amount': -amount,
            'category': 'transfer',
            'payment_method': 'debit',
            'recipient': recipient_id,
            'note': f'Transfer to {recipient_name}',
            'is_fraud': False
        }
        
        sender_response = supabase.table('transactions').insert(sender_transaction).execute()
        
        # Create recipient transaction (income)
        recipient_transaction = {
            'user_id': recipient_id,
            'description': description,
            'amount': amount,
            'category': 'transfer',
            'payment_method': 'debit',
            'recipient': sender_id,
            'note': f'Transfer from user {sender_id}',
            'is_fraud': False
        }
        
        recipient_response = supabase.table('transactions').insert(recipient_transaction).execute()
        
        return {
            "success": True, 
            "message": f"Successfully transferred ${amount:.2f} to {recipient_name}. Your new balance is ${sender_wallet['debit_balance'] - amount:.2f}."
        }
    except Exception as e:
        # Rollback if there's an error
        if 'sender_wallet' in locals() and 'recipient_wallet' in locals():
            supabase.table('wallets').update({'debit_balance': sender_wallet['debit_balance']}).eq('user_id', sender_id).execute()
            supabase.table('wallets').update({'debit_balance': recipient_wallet['debit_balance']}).eq('user_id', recipient_id).execute()
        return {"success": False, "error": str(e)}

def prepare_transfer_wrapper(x, current_user_id, conversation_data):
    """Wrapper function to prepare a transfer"""
    try:
        # Parse the input
        params = parse_transfer_input(x, current_user_id)
        
        # Check for parsing errors
        if "error" in params:
            return params
            
        # Prepare the transfer
        result = prepare_transfer(**params)
        
        # If successful, store the transfer in conversation data
        if result["success"]:
            conversation_data["pending_transfer"] = result["transfer"]
        
        return result
    except Exception as e:
        return {"success": False, "error": f"Transfer preparation failed: {str(e)}. Input was: {x}"}

def confirm_transfer(confirmation, conversation_data):
    """Confirm and execute a prepared transfer"""
    confirmation = confirmation.lower().strip()
    pending_transfer = conversation_data.get("pending_transfer")
    
    if not pending_transfer:
        return {"success": False, "error": "No pending transfer to confirm. Please prepare a transfer first."}
    
    # Check if the confirmation is positive
    positive_responses = ["yes", "confirm", "approve", "yes please", "okay", "ok", "sure", "proceed", "execute", "confirmed"]
    
    if any(pos in confirmation for pos in positive_responses):
        # Execute the transfer
        result = execute_transfer(pending_transfer)
        
        # Clear the pending transfer regardless of success
        conversation_data["pending_transfer"] = None
        
        return result
    else:
        # Cancel the transfer
        conversation_data["pending_transfer"] = None
        return {"success": True, "message": "Transfer canceled."}

def find_user_by_name(name):
    """Find a user by their name"""
    name_parts = name.lower().split()
    
    # Try to match by first name and last name
    if len(name_parts) > 1:
        first_name = name_parts[0]
        last_name = ' '.join(name_parts[1:])
        response = supabase.table('users').select('*').ilike('first_name', f"%{first_name}%").ilike('last_name', f"%{last_name}%").execute()
        if response.data:
            return response.data
    
    # Try to match by first name only
    response = supabase.table('users').select('*').ilike('first_name', f"%{name_parts[0]}%").execute()
    if response.data:
        return response.data
    
    # Try to match by last name only
    if len(name_parts) > 1:
        response = supabase.table('users').select('*').ilike('last_name', f"%{name_parts[-1]}%").execute()
        if response.data:
            return response.data
    
    return []

def make_conversation(user_id):
    context = get_transac_hist(user_id)
    
    # Initialize conversation data
    conversation_data = {
        "user_id": user_id,
        "context": context,
        "chat_history": [],
        "pending_transfer": None,  # Will store prepared transfers
        "agent_scratchpad": ""
    }
    
    # Define tools with closures to capture the current user_id and conversation_data
    tools = [
        Tool(
            name="get_users",
            func=lambda x: get_all_users(user_id),
            description="Get a list of all users in the system. Returns user_id, first_name, and last_name for each user."
        ),
        Tool(
            name="get_wallet",
            func=lambda x: get_user_wallet(x if x != "me" else user_id),
            description="Get wallet information for a specific user by providing their user_id. Use 'me' to get your own wallet."
        ),
        Tool(
            name="find_user",
            func=lambda x: find_user_by_name(x),
            description="Find a user by their name (first name, last name, or both)."
        ),
        Tool(
            name="prepare_transfer",
            func=lambda x: prepare_transfer_wrapper(x, user_id, conversation_data),
            description="Prepare a transfer to another user (but don't execute it). Provide a JSON with recipient_id, amount, and optional description."
        ),
        Tool(
            name="confirm_transfer",
            func=lambda x: confirm_transfer(x, conversation_data),
            description="Confirm or cancel a prepared transfer. Pass 'yes' to confirm or 'no' to cancel."
        )
    ]
    
    # Define the system prompt
    system_template = """You are a helpful AI assistant in a bank app. You are an expert in finance and accounting. 
    You reply as concisely as possible.
    
    Your user's ID is: {user_id}
    
    User transaction history:
    {context}
    
    You have access to the following tools:
    {tools}
    
    The available tools are: {tool_names}
    
    To use a tool, please use the following format:
    ```
    Thought: I need to use a tool to help answer the user's question.
    Action: tool_name
    Action Input: the input to the tool
    ```

    When you have the final answer or need to ask the user a question, respond in this format:
    ```
    Thought: I know what to tell the user.
    Final Answer: your response to the user here
    ```

    IMPORTANT - MONEY TRANSFERS REQUIRE TWO STEPS:
    1. First use prepare_transfer to check if the transfer is valid
    2. Then ask the user to confirm the transfer
    3. Only after confirmation, use confirm_transfer with the user's response
    
    When using the prepare_transfer tool, you only need to provide the recipient_id and amount:
    Action: prepare_transfer
    Action Input: {{"recipient_id": "user_456", "amount": 100, "description": "Payment for lunch"}}
    
    When a user isn't found in the database or you need clarification:
    1. First try the find_user tool to search for similar names
    2. If no matches are found, use the get_users tool to show available users
    3. Then use "Final Answer" to ask the user to select or specify a different recipient
        
    Use the tools to help the user with their banking needs. If they want to make a transfer:
    1. Get the list of users they can transfer to if needed
    2. Ask who they want to transfer to (if not specified)
    3. Ask for the amount (if not specified)
    4. Prepare the transfer and show details to the user
    5. ASK FOR CONFIRMATION before proceeding
    6. Only confirm the transfer if the user explicitly approves

    When a user mentions a name, use the find_user tool to look them up.

    Remember to be helpful, concise, and security-conscious.
    {agent_scratchpad}
    """

    # Create the prompt with system and human messages
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_template),
        ("human", "{input}"),  # Ensure the user's input is included as a human message
    ])

    # Get tool names for the prompt
    tool_names = ", ".join([tool.name for tool in tools])

    # Create the agent
    agent = create_react_agent(
        llm=chat_model,
        tools=tools,
        prompt=prompt
    )

    # Create the agent executor
    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        handle_parsing_errors=True,
    )

    # Store the agent executor and tools in conversation data
    conversation_data["agent_executor"] = agent_executor
    conversation_data["tools"] = tools
    conversation_data["tool_names"] = tool_names
    
    return conversation_data

def chat(conversation_data, message):
    agent_executor = conversation_data["agent_executor"]
    chat_history = conversation_data["chat_history"]
    context = conversation_data["context"]
    tools = conversation_data["tools"]
    tool_names = conversation_data["tool_names"]
    user_id = conversation_data["user_id"]
    agent_scratchpad = conversation_data.get("agent_scratchpad", "")

    # Format chat history as a string
    formatted_chat_history = ""
    for msg in chat_history:
        if isinstance(msg, HumanMessage):
            formatted_chat_history += f"Human: {msg.content}\n"
        elif isinstance(msg, AIMessage):
            formatted_chat_history += f"Assistant: {msg.content}\n"

    # Combine all inputs into a single dictionary
    inputs = {
        "input": message,  # The user's current message
        "chat_history": formatted_chat_history,
        "context": context,
        "tools": "\n\n".join([f"{tool.name}: {tool.description}" for tool in tools]),
        "tool_names": tool_names,
        "user_id": user_id,
        "agent_scratchpad": agent_scratchpad
    }

    # Run the agent
    response = agent_executor.invoke(inputs)

    # Update chat history
    chat_history.append(HumanMessage(content=message))
    chat_history.append(AIMessage(content=response["output"]))
    
    # Update scratchpad with intermediate steps
    conversation_data["agent_scratchpad"] = response.get("intermediate_steps", "")
    
    return response["output"]

def chat_test():
    print("\nGemini Chatbot (type 'exit' to quit)")
    conversation = make_conversation("user_123")
    
    while True:
        user_input = input("You: ")
        if user_input.lower() == "exit":
            print("Goodbye!")
            break
        
        response = chat(conversation, user_input)
        print("Gemini:", response)

if __name__ == "__main__":
    chat_test()