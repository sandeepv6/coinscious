import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import SystemMessage, HumanMessage
from dotenv import load_dotenv
from supabase import create_client
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

def make_conversation(user_id):
    context = get_transac_hist(user_id)
    conversation = [
            SystemMessage(content="You are a helpful AI assistant in a bank app. You are an expert in finance and accounting. You reply as concisely as possible."),
            HumanMessage(content=context),
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
        conversation.append(HumanMessage(content=message))
        response = chat_model(conversation)
        conversation.append(response)

        return response.content

if __name__ == "__main__":
    chat_test()

