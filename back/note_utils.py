import os
from pinecone import Pinecone, ServerlessSpec
from time import sleep
from dotenv import load_dotenv
load_dotenv()

pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
"""
index_name = "notes"

if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=768, # Replace with your model dimensions
        metric="cosine", # Replace with your model metric
        spec=ServerlessSpec(
            cloud="aws",
            region="us-east-1"
        ) 
    )
"""

from langchain_pinecone import PineconeVectorStore
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List
from langchain_community.vectorstores import FAISS
from langchain.docstore.document import Document
from supabase import create_client

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('ANON_SUPABASE_KEY')
supabase = create_client(supabase_url, supabase_key)

llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)
embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")


def get_notes(user_id):
    response = supabase.table('users').select("personal_notes").eq("user_id", user_id).execute()
    data = response.data[0]["personal_notes"]
    notes = [data[f"{i}"] for i in range(len(data.keys()))]
    return notes


def export_notes(notes):
    dict = {}
    for i, note in enumerate(notes):
        dict[f"{i}"] = note
    return dict


class Notes(BaseModel):
    """
    Write objective clinical point form notes on the transaction history of the user and user characteristics that can be infered from the history (e.g. habits). It will contain a healthy amount of numbers to keep track of things like transaction frequency and number of purchases.
    """

    notes: List[str] = Field(description="Clinical point form notes")

def make_note(transaction, notes="No history yet", llm=llm):

    system_template = "Here are past notes on the user and their transaction history, and a new transaction. Create a single concise note for the new transaction using the notes as context. Avoid including information already present in the transaction."


    prompt_template = ChatPromptTemplate.from_messages(
            [("system", system_template), ("user", "NOTES:\n{notes}\n\nNEW TRANSACTION:\n{transaction}")]
    )

    agent = prompt_template | llm

    response = agent.invoke({"notes": notes, "transaction": transaction})
    
    return response.content

def update_notes(transaction, notes="No history yet", llm=llm):

    structured_llm = llm.with_structured_output(Notes)
    system_template = """
    You are working on notes you took on the user and user's transaction history. The notes should include ample numbers to track quantitative patterns in their transaction history (including BUT NOT LIMITED TO transaction history and purchase amount). They should not only track quantiative patterns in their transaction history but also qualitative patterns. The notes should not only track transaction history patterns but also insights into the user (including BUT NOT LIMITED TO user habits, preferences, and personality). The notes should be concise and in point form notes, and the tone must be clinical. The notes should be able to capture as much information as you can about the user.
    
    Below are: your current notes and a new transaction. You will update your notes given this latest transaction. You will reorganize and simplify your notes to shorter. Always strive to store the information as concisely as possible without repetition. Remove repetition and details that are redundant and too specific. You will draw broader conclusions. You must analyze the user such as BUT NOT LIMITED TO their personality, likes/dislikes, habits, and other characteristics. DO NOT FORGET TO ACCOUNT FOR THE NEW TRANSACTION IN YOUR NOTES.
    """


    prompt_template = ChatPromptTemplate.from_messages(
            [("system", system_template), ("ai", "NOTES:\n{notes}\n\nNEW TRANSACTION:\n{transaction}")]
    )

    agent = prompt_template | structured_llm

    #print(prompt_template.invoke({"notes": notes, "transaction": transaction}))
    response = agent.invoke({"notes": notes, "transaction": transaction})
    
    return response.notes

if __name__ == "__main__":
    notes = ["Empty"]
    transactions = [
        "2023-10-26 08:15: Espresso, 'The Daily Grind', $3.50",
        "2023-10-26 12:30: Latte, 'Cafe Meow', $4.75",
        "2023-10-27 09:00: Cappuccino, 'Bean Scene', $4.20",
        "2023-10-28 11:45: Iced Coffee, 'Cool Beans', $3.90",
        "2023-10-29 14:20: Mocha, 'Sweet Sip', $5.10",
        "2023-10-31 12:00: Etransfer, 'Tutor', $30",
        "2023-11-10 12:00: Subscription, 'Corsera', $50",
        "2023-11-31 12:00: Subscription, 'Cooking Class', $50",
    ]

    transaction_notes = []
    for transaction in transactions:
        transaction_note = make_note(transaction, notes)
        transaction_notes.append(transaction_note)
        notes = update_notes(transaction, notes)
        print(f"\n\n{transaction}:\n- {'\n- '.join(notes)}\n\n")
    print("Individual transaction notes:")
    for transaction, note in zip(transactions, transaction_notes):
        print(transaction, note)

    texts = [Document(page_content=note) for note in notes]
    vectorstore = FAISS.from_documents(texts, embeddings)
    input("waiting for stupid pinecone...")
    retriever = vectorstore.as_retriever(search_type="mmr")
    docs = retriever.invoke("Educational expenses")
    print("Educational expenses:", docs, "\n")

    texts1 = [Document(page_content=note, metadata={"transaction": transaction}) for transaction, note in zip(transactions, transaction_notes)]
    vectorstore1 = FAISS.from_documents(texts1, embeddings)
    retriever1 = vectorstore1.as_retriever(search_type="mmr")
    docs1 = retriever1.invoke("Educational expenses")
    print("Educational expenses:", docs1)
