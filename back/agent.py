import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import SystemMessage, HumanMessage
from langchain_core.tools import tool
from dotenv import load_dotenv
from supabase import create_client
load_dotenv()


# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('ANON_SUPABASE_KEY')
supabase = create_client(supabase_url, supabase_key)

# Initialize the chat model
chat_model = ChatGoogleGenerativeAI(model="gemini-2.0-flash")

@tool
def search_history(query: str, user_id: str):
    """Searches the transaction history of the user (user_id) and returns an answer to your query.

    Args:
        query: a question about the user's transaction history
        user_id: the user's user_id
    """
    
    context = get_transac_hist(user_id)
    conversation = [
            SystemMessage(content="You are an accurate document Q&A AI. You provide accurate answers to questions regarding the text below."),
            HumanMessage(content=context),
            HumanMessage(content=query),
            ]
    response = chat_model(conversation)
    return response.content

def get_transac_hist(user_id):
    response = supabase.table('transactions').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
    transactions = response.data

    string = ""
    for transaction in transactions:
        string += f"{transaction['created_at']} | {transaction['description']}; {transaction['note']}: ${transaction['amount']}\n"

    return string[:-1]

def make_conversation(user_id):
    conversation = [
            SystemMessage(content=f"You are a helpful AI assistant in a bank app. You are an expert in finance and accounting. You reply as concisely as possible. The user's id is user_id='{user_id}'."),
            ]
    return conversation

def chat_test():
    print("\nGemini Chatbot (type 'exit' to quit)")
    conversation = [SystemMessage(content="You are a helpful AI assistant.")]
    
    while True:
        user_input = input("You: ")
        if user_input.lower() == "exit":
            print("Goodbye!")
            break
        
        conversation.append(HumanMessage(content=user_input))
        response = chat_model(conversation)
        print("Gemini:", response.content)
        
        conversation.append(response)

def chat(conversation, message):

    agent = chat_model.bind_tools([search_history])

    conversation.append(HumanMessage(content=message))
    response = agent.invoke(conversation)

    if not response.content == "" and not response.tool_calls:
        return response.content

    if response.content == "" and response.tool_calls:
        response.content = "Executing tool calls..."
    conversation.append(response)

    for tool_call in response.tool_calls:
        selected_tool = {"search_history": search_history}[tool_call["name"].lower()]
        tool_msg = selected_tool.invoke(tool_call)
        conversation.append(tool_msg)
        print(conversation[-1])

    response = agent.invoke(conversation)

    return response.content

if __name__ == "__main__":
    chat_test()

