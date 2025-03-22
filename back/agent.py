import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import SystemMessage, HumanMessage
from dotenv import load_dotenv
load_dotenv()

# Initialize the chat model
chat_model = ChatGoogleGenerativeAI(model="gemini-2.0-flash")

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

