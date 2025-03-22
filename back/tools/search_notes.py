from typing import Dict, Any, List, Optional
from supabase import create_client
import os
from dotenv import load_dotenv
import pinecone
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import datetime

load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('ANON_SUPABASE_KEY')
supabase = create_client(supabase_url, supabase_key)

# Initialize Pinecone
pinecone_api_key = os.getenv('PINECONE_API_KEY')
pinecone_env = os.getenv('PINECONE_ENV')
# Initialize Pinecone client (using the latest API)
pc = pinecone.Pinecone(api_key=pinecone_api_key)

# Initialize Gemini embeddings
gemini_api_key = os.getenv('GEMINI_API_KEY')
embeddings = GoogleGenerativeAIEmbeddings(
    model="embedding-001",
    google_api_key=gemini_api_key
)

# Pinecone index - using an index named "notes"
index_name = "notes"
# Check if index exists
existing_indexes = [index.name for index in pc.list_indexes()]
if index_name not in existing_indexes:
    # Create index if it doesn't exist (in actual implementation, it's better to create this in a separate script)
    pc.create_index(
        name=index_name,
        dimension=768,  # Gemini embedding dimension
        metric="cosine"
    )

index = pc.Index(index_name)

def search_notes_tool(user_id: str, query: str, top_k: int = 5) -> Dict[str, Any]:
    """
    Search for transactions similar to the query in the user's transaction notes (using RAG technique).
    
    Args:
        user_id: User ID
        query: Search query
        top_k: Number of results to return
        
    Returns:
        Dictionary containing search results
    """
    try:
        # 1. Generate query embedding
        query_embedding = embeddings.embed_query(query)
        
        # 2. Search for similar vectors in Pinecone
        search_results = index.query(
            vector=query_embedding,
            filter={"user_id": user_id},
            top_k=top_k,
            include_metadata=True
        )
        
        if not search_results['matches']:
            return {
                "success": True,
                "message": "No search results found.",
                "results": []
            }
        
        # 3. Extract transaction IDs from search results
        transaction_ids = [match['metadata']['transaction_id'] for match in search_results['matches']]
        
        # 4. Query detailed transaction information from Supabase
        transactions = []
        for transaction_id in transaction_ids:
            response = supabase.table('transactions').select('*').eq('id', transaction_id).execute()
            if response.data:
                transactions.append(response.data[0])
        
        # 5. Format results
        formatted_results = []
        total_amount = 0
        
        for transaction in transactions:
            formatted_date = datetime.datetime.fromisoformat(transaction['created_at']).strftime('%Y-%m-%d')
            formatted_results.append({
                "id": transaction['id'],
                "date": formatted_date,
                "amount": transaction['amount'],
                "category": transaction['category'],
                "note": transaction['note'],
                "recipient": transaction.get('recipient', '-')
            })
            total_amount += transaction['amount']
        
        # 6. Return results
        return {
            "success": True,
            "message": f"Found {len(formatted_results)} transactions related to '{query}'.",
            "total_amount": total_amount,
            "results": formatted_results
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Error occurred during search: {str(e)}"
        }

def save_note_embedding(transaction_id: str, note: str, user_id: str, amount: float, category: str) -> bool:
    """
    Generate and save an embedding for a transaction note to Pinecone.
    
    Args:
        transaction_id: Transaction ID
        note: Transaction note
        user_id: User ID
        amount: Transaction amount
        category: Transaction category
        
    Returns:
        Success status
    """
    try:
        # 1. Generate note embedding
        vector = embeddings.embed_query(note)
        
        # 2. Save to Pinecone
        index.upsert(
            vectors=[
                {
                    "id": transaction_id,
                    "values": vector,
                    "metadata": {
                        "transaction_id": transaction_id,
                        "user_id": user_id,
                        "amount": amount,
                        "category": category,
                        "note": note
                    }
                }
            ]
        )
        
        return True
        
    except Exception as e:
        print(f"Embedding save error: {str(e)}")
        return False
